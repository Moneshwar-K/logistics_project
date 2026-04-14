import { DutyBill, Shipment } from '../models';
import { getNextSequence } from '../utils/sequenceGenerator';
import mongoose from 'mongoose';

export const dutyBillService = {
  async createDutyBill(data: any, createdById: string, branchId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bill_number = await getNextSequence('duty_bill', 'DTY');
      
      const dutyBill = new DutyBill({
        ...data,
        bill_number,
        created_by_id: createdById,
        branch_id: branchId
      });

      await dutyBill.save({ session });

      // Update shipments status if needed
      if (data.shipment_ids && data.shipment_ids.length > 0) {
        await Shipment.updateMany(
          { _id: { $in: data.shipment_ids } },
          { $set: { status: 'duty_billed' } },
          { session }
        );
      }

      await session.commitTransaction();
      return dutyBill;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },

  async listDutyBills(filters: any, page: number = 1, limit: number = 50) {
    const query: any = {};
    
    if (filters.branch_id) query.branch_id = filters.branch_id;
    if (filters.bill_number) query.bill_number = { $regex: filters.bill_number, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      DutyBill.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('shipment_ids', 'hawb total_weight total_cartons')
        .lean(),
      DutyBill.countDocuments(query)
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  },

  async getDutyBillById(id: string) {
    const dutyBill = await DutyBill.findById(id)
      .populate('shipment_ids')
      .populate('branch_id', 'name')
      .populate('created_by_id', 'name')
      .lean();
      
    if (!dutyBill) throw new Error('Duty Bill not found');
    return dutyBill;
  }
};
