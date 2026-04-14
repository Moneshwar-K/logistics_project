import { createError } from '../middleware/errorHandler';
import { EWayBill, IEWayBill } from '../models';
import { Shipment } from '../models';
import mongoose from 'mongoose';
import { getNextSequence } from '../utils/sequenceGenerator';

// Validate GSTIN format (15 characters)
function validateGSTIN(gstin: string): boolean {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

// Calculate validity period based on distance
function calculateValidity(distance: number): number {
  // E-way bill validity rules:
  // Up to 100 km: 1 day
  // For every additional 100 km or part thereof: 1 additional day
  if (distance <= 100) return 1;
  return Math.ceil(distance / 100);
}

export const ewayBillService = {
  async createEWayBill(
    data: {
      shipment_id: string;
      consignor_gstin: string;
      consignee_gstin: string;
      document_number: string; // Invoice number
      document_date: string;
      value_of_goods: number;
      hsn_code: string;
      transport_mode: '1' | '2' | '3' | '4'; // 1: Road, 2: Rail, 3: Air, 4: Ship
      vehicle_number?: string;
      transporter_name?: string;
      transporter_id?: string;
      distance_km: number;
      remarks?: string;
    },
    createdById: string,
    branchId: string
  ): Promise<IEWayBill> {
    // Validate shipment exists
    const shipment = await Shipment.findById(data.shipment_id)
      .populate('shipper_id')
      .populate('consignee_id')
      .lean();

    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Validate GSTINs
    if (!validateGSTIN(data.consignor_gstin)) {
      throw createError('Invalid consignor GSTIN format', 400);
    }
    if (!validateGSTIN(data.consignee_gstin)) {
      throw createError('Invalid consignee GSTIN format', 400);
    }

    // Check if e-way bill already exists for this shipment
    const existing = await EWayBill.findOne({ shipment_id: data.shipment_id });
    if (existing && existing.status !== 'cancelled') {
      throw createError('Active e-way bill already exists for this shipment', 400);
    }

    // Generate e-way bill number (15 digits)
    const eway_bill_number = await getNextSequence('eway_bill', '');
    const paddedNumber = eway_bill_number.replace(/\D/g, '').padStart(15, '0');

    // Calculate validity
    const validity_days = calculateValidity(data.distance_km);
    const valid_from = new Date();
    const valid_until = new Date(valid_from);
    valid_until.setDate(valid_until.getDate() + validity_days);

    // Create e-way bill
    const ewayBill = await EWayBill.create({
      eway_bill_number: paddedNumber,
      shipment_id: new mongoose.Types.ObjectId(data.shipment_id),
      consignor_gstin: data.consignor_gstin,
      consignee_gstin: data.consignee_gstin,
      document_number: data.document_number,
      document_date: new Date(data.document_date),
      value_of_goods: data.value_of_goods,
      hsn_code: data.hsn_code,
      transport_mode: data.transport_mode,
      vehicle_number: data.vehicle_number?.toUpperCase() || undefined,
      transporter_name: data.transporter_name || 'Sri Caargo',
      transporter_id: data.transporter_id || undefined,
      distance_km: data.distance_km,
      valid_from,
      valid_till: valid_until,
      validity_days,
      status: 'generated',
      remarks: data.remarks || undefined,
      generated_by_id: new mongoose.Types.ObjectId(createdById),
      branch_id: new mongoose.Types.ObjectId(branchId),
    });

    return ewayBill.toObject();
  },

  async getEWayBill(ewayBillId: string): Promise<IEWayBill> {
    const ewayBill = await EWayBill.findById(ewayBillId)
      .populate('shipment_id')
      .populate('generated_by_id', 'name email')
      .lean<IEWayBill>();

    if (!ewayBill) {
      throw createError('E-way bill not found', 404);
    }

    return ewayBill as unknown as IEWayBill;
  },

  async getEWayBillByNumber(ewayBillNumber: string): Promise<IEWayBill> {
    const ewayBill = await EWayBill.findOne({ eway_bill_number: ewayBillNumber })
      .populate('shipment_id')
      .populate('generated_by_id', 'name email')
      .lean<IEWayBill>();

    if (!ewayBill) {
      throw createError('E-way bill not found', 404);
    }

    return ewayBill as unknown as IEWayBill;
  },

  async getEWayBillByShipment(shipmentId: string): Promise<IEWayBill | null> {
    const ewayBill = await EWayBill.findOne({ shipment_id: shipmentId })
      .populate('generated_by_id', 'name email')
      .lean<IEWayBill>();

    return ewayBill as unknown as IEWayBill | null;
  },

  async updateEWayBill(ewayBillId: string, updateData: any): Promise<IEWayBill> {
    const ewayBill = await EWayBill.findById(ewayBillId);
    if (!ewayBill) {
      throw createError('E-way bill not found', 404);
    }

    if (ewayBill.status === 'cancelled' || ewayBill.status === 'delivered') {
      throw createError(`Cannot update e-way bill with status: ${ewayBill.status}`, 400);
    }

    const updated = await EWayBill.findByIdAndUpdate(
      ewayBillId,
      { $set: updateData },
      { new: true }
    ).lean<IEWayBill>();

    return updated as unknown as IEWayBill;
  },

  async getStatus(ewayBillId: string): Promise<{ status: string; valid_till: Date }> {
    const ewayBill = await EWayBill.findById(ewayBillId).select('status valid_till').lean<IEWayBill>();
    if (!ewayBill) {
      throw createError('E-way bill not found', 404);
    }
    return {
      status: ewayBill.status,
      valid_till: ewayBill ? (ewayBill as any).valid_till : new Date(),
    };
  },

  async cancelEWayBill(
    ewayBillId: string,
    cancellationReason: string,
    cancelledById?: string
  ): Promise<IEWayBill> {
    const ewayBill = await EWayBill.findById(ewayBillId);

    if (!ewayBill) {
      throw createError('E-way bill not found', 404);
    }

    if (ewayBill.status === 'cancelled') {
      throw createError('E-way bill is already cancelled', 400);
    }

    if (ewayBill.status === 'expired') {
      throw createError('Cannot cancel expired e-way bill', 400);
    }

    const update: any = {
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: cancellationReason,
    };

    if (cancelledById) {
      update.cancelled_by_id = new mongoose.Types.ObjectId(cancelledById);
    }

    await EWayBill.findByIdAndUpdate(
      ewayBillId,
      { $set: update },
      { new: true }
    );

    return this.getEWayBill(ewayBillId);
  },

  async listEWayBills(filters: any, page: number, limit: number) {
    const query: any = {};

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.date_from || filters.date_to) {
      query.valid_from = {};
      if (filters.date_from) {
        query.valid_from.$gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        query.valid_from.$lte = new Date(filters.date_to);
      }
    }

    const total = await EWayBill.countDocuments(query);
    const offset = (page - 1) * limit;

    const data = await EWayBill.find(query)
      .populate('shipment_id', 'hawb')
      .populate('generated_by_id', 'name email')
      .sort({ valid_from: -1 })
      .limit(limit)
      .skip(offset)
      .lean<IEWayBill[]>();

    return {
      data: data as any,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  },

  // Background job to mark expired e-way bills
  async markExpiredEWayBills(): Promise<number> {
    const result = await EWayBill.updateMany(
      {
        status: 'in_transit',
        valid_till: { $lt: new Date() },
      },
      {
        $set: { status: 'expired' },
      }
    );

    return result.modifiedCount;
  },
};
