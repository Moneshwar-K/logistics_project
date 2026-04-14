import { createError } from '../middleware/errorHandler';
import { Shipment } from '../models';
import { TrackingEvent, ITrackingEvent } from '../models';
import { Document as DocumentModel } from '../models';
import mongoose from 'mongoose';

export const trackingService = {
  async quickTracking(query: { hawb?: string; awb?: string; reference_number?: string }) {
    if (!query.hawb && !query.awb && !query.reference_number) {
      throw createError('HAWB, AWB, or reference number is required', 400);
    }

    let shipment;
    if (query.hawb) {
      shipment = await Shipment.findOne({ hawb: query.hawb.toUpperCase() })
        .populate('shipper_id', '-__v')
        .populate('consignee_id', '-__v')
        .lean<any>();
    } else {
      // Search by AWB or reference number
      const searchQuery: any = {};
      if (query.awb) {
        searchQuery.awb = query.awb;
      }
      if (query.reference_number) {
        searchQuery.reference_number = query.reference_number;
      }

      shipment = await Shipment.findOne(searchQuery)
        .populate('shipper_id', '-__v')
        .populate('consignee_id', '-__v')
        .lean<any>();
    }

    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    return this.getTrackingDetails(shipment._id.toString());
  },

  async getTrackingDetails(shipmentId: string) {
    // Get shipment
    const shipment = await Shipment.findById(shipmentId)
      .populate('shipper_id', '-__v')
      .populate('consignee_id', '-__v')
      .lean<any>();

    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Get tracking events
    const events = await TrackingEvent.find({ shipment_id: shipmentId })
      .sort({ timestamp: -1 })
      .lean<ITrackingEvent[]>();

    // Get current status (latest event)
    const currentStatus = events[0] || null;

    // Get documents
    const documents = await DocumentModel.find({ shipment_id: shipmentId })
      .sort({ uploaded_at: -1 })
      .lean<any[]>();

    // Calculate transit summary
    const firstScan = events[events.length - 1];
    const lastScan = events[0];

    return {
      shipment,
      current_status: currentStatus,
      tracking_history: events,
      documents,
      transit_summary: {
        total_cartons: shipment.total_cartons,
        total_weight: shipment.total_weight,
        first_scan_date: firstScan?.timestamp || shipment.created_at,
        last_scan_date: lastScan?.timestamp || shipment.updated_at,
      },
    };
  },

  async createTrackingEvent(
    shipmentId: string,
    data: {
      status: string;
      location: string;
      city: string;
      country: string;
      remarks?: string;
      timestamp?: string;
      scanned_by_id?: string;
      temperature?: number;
      humidity?: number;
      proof_of_delivery_url?: string;
    },
    createdById: string
  ): Promise<ITrackingEvent> {
    // Verify shipment exists
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Create tracking event
    const event = await TrackingEvent.create({
      shipment_id: new mongoose.Types.ObjectId(shipmentId),
      event_type: 'status_update',
      status: data.status,
      location: data.location,
      city: data.city,
      country: data.country,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      remarks: data.remarks || undefined,
      scanned_by_id: data.scanned_by_id
        ? new mongoose.Types.ObjectId(data.scanned_by_id)
        : undefined,
      created_by_id: new mongoose.Types.ObjectId(createdById),
      temperature: data.temperature || undefined,
      humidity: data.humidity || undefined,
      proof_of_delivery_url: data.proof_of_delivery_url || undefined,
    });

    // Update shipment's current location and last tracking update
    await Shipment.findByIdAndUpdate(shipmentId, {
      $set: {
        current_location: data.city || data.location,
        last_tracking_update: new Date(),
      },
    });

    return event.toObject() as unknown as ITrackingEvent;
  },

  async getTrackingHistory(shipmentId: string): Promise<ITrackingEvent[]> {
    const events = await TrackingEvent.find({ shipment_id: shipmentId })
      .sort({ timestamp: -1 })
      .lean<ITrackingEvent[]>();
    return events as unknown as ITrackingEvent[];
  },
};
