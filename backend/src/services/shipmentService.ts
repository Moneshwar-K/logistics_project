import { createError } from '../middleware/errorHandler';
import { Shipment, IShipment, ShipmentStatus, TrackingEvent } from '../models';
import { Party } from '../models';
import mongoose from 'mongoose';
import { getNextSequence } from '../utils/sequenceGenerator';
import { sendEmail, emailTemplates } from '../utils/emailService';

// Status transition validation
const STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  pending: ['picked_up', 'out_for_pickup', 'cancelled'],
  out_for_pickup: ['picked_up', 'pending', 'cancelled'],
  picked_up: ['manifested', 'in_transit', 'on_hold'],
  manifested: ['dispatched', 'picked_up', 'on_hold'],
  dispatched: ['received_at_hub', 'in_transit', 'exception'],
  received_at_hub: ['manifested', 'dispatched', 'in_transit', 'received_at_destination'],
  in_transit: ['in_port', 'received_at_destination', 'exception', 'on_hold'],
  in_port: ['customs_clearance', 'on_hold', 'received_at_destination'],
  received_at_destination: ['ready_for_delivery', 'out_for_delivery', 'exception'],
  customs_clearance: ['ready_for_delivery', 'exception', 'received_at_destination', 'duty_billed'],
  duty_billed: ['ready_for_delivery', 'out_for_delivery', 'exception'],
  ready_for_delivery: ['out_for_delivery', 'on_hold'],
  out_for_delivery: ['delivered', 'exception', 'on_hold'],
  delivered: [],
  on_hold: ['in_transit', 'pending', 'exception', 'received_at_destination', 'out_for_delivery'],
  exception: ['in_transit', 'on_hold', 'pending', 'received_at_destination'],
  cancelled: [],
};

function isValidStatusTransition(current: ShipmentStatus, next: ShipmentStatus): boolean {
  return STATUS_TRANSITIONS[current]?.includes(next) || false;
}

export const shipmentService = {
  async getCustomerPartyId(email: string) {
    const party = await Party.findOne({ email: email.toLowerCase() });
    return party ? party._id : null;
  },

  async listShipments(filters: any, page: number, limit: number, user: any) {
    const query: any = {};

    // Apply role-based isolation
    if (user.role === 'customer') {
      const partyId = await this.getCustomerPartyId(user.email);
      if (partyId) {
        query.$or = [{ shipper_id: partyId }, { consignee_id: partyId }];
      } else {
        return {
          data: [],
          pagination: { page, limit, total: 0, total_pages: 0 },
        };
      }
    }

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.hawb) {
      query.hawb = { $regex: filters.hawb, $options: 'i' };
    }
    if (filters.origin_city) {
      query.origin_city = { $regex: filters.origin_city, $options: 'i' };
    }
    if (filters.destination_city) {
      query.destination_city = { $regex: filters.destination_city, $options: 'i' };
    }
    if (filters.date_from || filters.date_to) {
      query.created_at = {};
      if (filters.date_from) {
        query.created_at.$gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        const endDate = new Date(filters.date_to);
        endDate.setHours(23, 59, 59, 999);
        query.created_at.$lte = endDate;
      }
    }

    // Get total count
    const total = await Shipment.countDocuments(query);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await Shipment.find(query)
      .populate('shipper_id', '-__v')
      .populate('consignee_id', '-__v')
      .populate('branch_id', '-__v')
      .populate('created_by_id', 'name email')
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .lean<IShipment[]>();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  },

  async getShipmentById(id: string, user?: any): Promise<IShipment> {
    const query: any = { _id: id };

    if (user && user.role === 'customer') {
      const partyId = await this.getCustomerPartyId(user.email);
      if (partyId) {
        query.$or = [{ shipper_id: partyId }, { consignee_id: partyId }];
      } else {
        throw createError('Shipment not found or access denied', 404);
      }
    }

    const shipment = await Shipment.findOne(query)
      .populate('shipper_id', '-__v')
      .populate('consignee_id', '-__v')
      .populate('branch_id', '-__v')
      .populate('created_by_id', 'name email')
      .lean<IShipment>();

    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    return shipment as unknown as IShipment;
  },

  async getShipmentByHAWB(hawb: string): Promise<IShipment> {
    const shipment = await Shipment.findOne({ hawb: hawb.toUpperCase() })
      .populate('shipper_id', '-__v')
      .populate('consignee_id', '-__v')
      .populate('branch_id', '-__v')
      .populate('created_by_id', 'name email')
      .lean<IShipment>();

    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    return shipment as unknown as IShipment;
  },

  async createShipment(data: any, createdById: string, branchId: string): Promise<any> {
    // Generate HAWB using sequence
    const hawb = await getNextSequence('hawb', 'HAW');

    // Create or get parties
    const shipper = await this.getOrCreateParty(data.shipper);
    const consignee = await this.getOrCreateParty(data.consignee);

    // Calculate estimated delivery date based on service type
    const estimatedDays = data.service_type === 'express' ? 2 : data.service_type === 'standard' ? 5 : 7;
    const estimated_delivery_date = new Date();
    estimated_delivery_date.setDate(estimated_delivery_date.getDate() + estimatedDays);

    // Validate IDs
    if (!branchId || !mongoose.Types.ObjectId.isValid(branchId)) {
      throw createError('Valid Branch ID is required to create a shipment. Your account may not be linked to a branch.', 400);
    }
    if (!createdById || !mongoose.Types.ObjectId.isValid(createdById)) {
      throw createError('Authentication session is invalid. Please relogin.', 401);
    }

    // Create shipment
    const shipment = await Shipment.create({
      hawb,
      awb: data.awb || undefined,
      shipper_id: shipper._id,
      consignee_id: consignee._id,
      origin_city: data.origin_city,
      origin_country: data.origin_country,
      destination_city: data.destination_city,
      destination_country: data.destination_country,
      service_type: data.service_type,
      shipment_type: data.shipment_type,
      total_cartons: data.total_cartons,
      total_weight: data.total_weight,
      total_weight_cbm: data.total_weight_cbm || undefined,
      invoice_value: data.invoice_value,
      invoice_currency: data.invoice_currency || 'INR',
      status: 'pending',
      current_location: data.origin_city,
      estimated_delivery_date,
      mode: data.mode,
      carrier: data.carrier || undefined,
      reference_number: data.reference_number || undefined,
      branch_id: new mongoose.Types.ObjectId(branchId),
      created_by_id: new mongoose.Types.ObjectId(createdById),
    });

    // Send booking confirmation email
    const shipperEmail = shipper.email;
    if (shipperEmail) {
      sendEmail({
        to: shipperEmail,
        subject: `Shipment Booking Confirmed - ${hawb}`,
        html: emailTemplates.shipmentBooking({
          customerName: shipper.name,
          hawb,
          origin: `${data.origin_city}, ${data.origin_country}`,
          destination: `${data.destination_city}, ${data.destination_country}`,
          serviceType: data.service_type,
          cartons: data.total_cartons,
          weight: data.total_weight,
        }),
      }).catch(err => console.error('Error sending booking email:', err));
    }

    return this.getShipmentById(shipment._id.toString());
  },

  async updateShipment(id: string, updateData: any): Promise<any> {
    // Check if shipment exists
    const existing = await Shipment.findById(id);
    if (!existing) {
      throw createError('Shipment not found', 404);
    }

    // Validate status transition if status is being updated
    if (updateData.status && updateData.status !== existing.status) {
      if (!isValidStatusTransition(existing.status, updateData.status)) {
        throw createError(
          `Invalid status transition from ${existing.status} to ${updateData.status}`,
          400
        );
      }
    }

    // Update shipment
    const updated = await Shipment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw createError('Shipment not found', 404);
    }

    // Create tracking event if status changed
    if (updateData.status && updateData.status !== existing.status) {
      await TrackingEvent.create({
        shipment_id: updated._id,
        status: updated.status,
        location: updated.current_location || updated.origin_city,
        city: updated.origin_city,
        country: updated.origin_country || 'India',
        scanned_by: 'system',
        remarks: updateData.comments || 'Status updated via Operations Portal',
      });
    }

    return this.getShipmentById(updated._id.toString());
  },

  async deleteShipment(id: string): Promise<void> {
    const shipment = await Shipment.findById(id);
    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Only allow deletion of pending or cancelled shipments
    const deletableStatuses: ShipmentStatus[] = ['pending', 'cancelled'];
    if (!deletableStatuses.includes(shipment.status)) {
      throw createError(
        `Cannot delete shipment with status '${shipment.status}'. Only pending or cancelled shipments can be deleted.`,
        400
      );
    }

    await Shipment.findByIdAndDelete(id);
  },

  async getOrCreateParty(partyData: any) {
    if (!partyData || !partyData.name) {
      throw createError('Party name is required', 400);
    }

    // Normalize: use email if provided, else generate placeholder from phone or name
    const rawEmail = partyData.email || partyData.contact_email || '';
    const phone = (partyData.contact_phone || partyData.phone || '').replace(/\D/g, '').slice(-10);
    const namePart = partyData.name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const email = rawEmail.trim()
      ? rawEmail.trim().toLowerCase()
      : phone
        ? `${phone}@noemail.sricaargo.com`
        : `${namePart}@noemail.sricaargo.com`;

    // Try to find existing party by email, or by phone if phone is available
    let party = await Party.findOne({ email });

    if (!party && phone) {
      party = await Party.findOne({ phone });
    }

    if (!party) {
      // Create new party with all available data
      const phone_val = partyData.contact_phone || partyData.phone || 'N/A';
      const address_val = partyData.address || partyData.contact_address || 'Not Provided';
      const city_val = partyData.city || partyData.contact_city || 'Not Provided';
      const country_val = partyData.country || partyData.origin_country || 'India';

      party = await Party.create({
        name: partyData.name,
        email,
        phone: phone_val,
        address: address_val,
        city: city_val,
        state: partyData.state || partyData.contact_state || '',
        country: country_val,
        party_type: partyData.role === 'consignee' ? 'consignee' : 'client',
        gst_number: partyData.gstin || partyData.gst_number || undefined,
        contact_person: partyData.contact_person || partyData.name,
      });
    }

    return party;
  },

  async updatePOD(id: string, status: 'delivered' | 'exception', podData: any) {
    const shipment = await Shipment.findById(id);
    if (!shipment) throw createError('Shipment not found', 404);

    const update: any = { status };
    if (status === 'delivered') update.actual_delivery_date = new Date();
    if (podData.remarks) update.comments = podData.remarks; // Assuming we have comments field or similar

    const updated = await Shipment.findByIdAndUpdate(id, update, { new: true });
    return updated;
  },

  async getBranchStock(branchId: string) {
    return await Shipment.find({
      current_branch_id: branchId,
      status: { $nin: ['delivered', 'dispatched', 'in_transit'] }
    })
      .populate('shipper_id', 'name')
      .populate('consignee_id', 'name')
      .lean();
  },

  async getTracking(id: string) {
    const shipment = await Shipment.findById(id)
      .populate('shipper_id', 'name')
      .populate('consignee_id', 'name')
      .populate('branch_id', 'name')
      .lean();
    if (!shipment) throw createError('Shipment not found', 404);

    // Fetch real tracking events from the TrackingEvent model
    const trackingEvents = await TrackingEvent.find({ shipment_id: id })
      .sort({ timestamp: -1 })
      .lean();

    // Always include the initial "created" event derived from shipment data
    const createdEvent = {
      status: 'created',
      date: shipment.created_at,
      location: shipment.origin_city,
      city: shipment.origin_city,
      country: shipment.origin_country || '',
      scanned_by: 'system',
    };

    return {
      ...shipment,
      events: [createdEvent, ...trackingEvents],
    };
  }
};
