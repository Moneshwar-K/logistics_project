import { createError } from '../middleware/errorHandler';
import { HAWBAudit, IHAWBAudit, IOperationStatusUpdate } from '../models';
import { Shipment } from '../models';
import { OperationStatusUpdate } from '../models';
import mongoose from 'mongoose';

export const auditService = {
  async getDashboard() {
    // Get total HAWBs
    const totalHawbs = await Shipment.countDocuments();

    // Get pending audits
    const pendingAudits = await HAWBAudit.countDocuments({ audit_status: 'pending' });

    // Get audited today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const auditedToday = await HAWBAudit.countDocuments({
      audit_date: { $gte: today, $lt: tomorrow },
      audit_status: 'completed',
    });

    // Get discrepancies
    const discrepancies = await HAWBAudit.countDocuments({
      audit_status: 'discrepancy_found',
    });

    // Get total balance amount
    const balanceResult = await HAWBAudit.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$balance_amount' },
        },
      },
    ]);
    const balanceAmount = balanceResult[0]?.total || 0;

    // Get recent activity
    const recentActivity = await OperationStatusUpdate.find()
      .sort({ created_at: -1 })
      .limit(10)
      .populate('shipment_id', 'hawb')
      .populate('updated_by_id', 'name')
      .lean<IOperationStatusUpdate[]>();

    return {
      total_hawbs: totalHawbs,
      pending_audits: pendingAudits,
      audited_today: auditedToday,
      discrepancies,
      balance_amount: balanceAmount,
      recent_activity: recentActivity as any,
    };
  },

  async listHAWBAudits(filters: any, page: number, limit: number) {
    const query: any = {};

    // Apply filters
    if (filters.status) {
      query.audit_status = filters.status;
    }
    if (filters.hawb) {
      query.hawb = filters.hawb.toUpperCase();
    }

    // Get total count
    const total = await HAWBAudit.countDocuments(query);

    // Apply pagination
    const offset = (page - 1) * limit;
    const data = await HAWBAudit.find(query)
      .populate('shipment_id', '-__v')
      .populate('audited_by_id', 'name email')
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(offset)
      .lean<IHAWBAudit[]>();

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

  async createAudit(
    hawb: string,
    auditData: {
      total_cartons: number;
      cartons_verified: number;
      weight_variance: number;
      remarks?: string;
      discrepancies?: string[];
      balance_amount: number;
    },
    auditedById: string,
    branchId: string
  ): Promise<IHAWBAudit> {
    // Get shipment
    const shipment = await Shipment.findOne({ hawb: hawb.toUpperCase() });
    if (!shipment) {
      throw createError('Shipment not found', 404);
    }

    // Check if audit already exists
    const existing = await HAWBAudit.findOne({ hawb: hawb.toUpperCase() });
    if (existing) {
      throw createError('Audit already exists for this HAWB. It has already been audited.', 400);
    }

    // Determine audit status
    const hasDiscrepancies =
      auditData.cartons_verified !== auditData.total_cartons ||
      Math.abs(auditData.weight_variance) > 0.1 ||
      (auditData.discrepancies && auditData.discrepancies.length > 0);

    const auditStatus = hasDiscrepancies ? 'discrepancy_found' : 'completed';

    // Use shipment's branch if user has no branch assigned (e.g. admin)
    const effectiveBranchId =
      branchId && mongoose.Types.ObjectId.isValid(branchId)
        ? branchId
        : shipment.branch_id?.toString();

    if (!effectiveBranchId || !mongoose.Types.ObjectId.isValid(effectiveBranchId)) {
      throw createError('No valid branch found for this audit. Please assign a branch to your account.', 400);
    }

    // Create audit
    const audit = await HAWBAudit.create({
      hawb: hawb.toUpperCase(),
      shipment_id: shipment._id,
      audit_status: auditStatus,
      audit_date: new Date(),
      audited_by_id: new mongoose.Types.ObjectId(auditedById),
      total_cartons: auditData.total_cartons,
      cartons_verified: auditData.cartons_verified,
      weight_variance: auditData.weight_variance,
      remarks: auditData.remarks || undefined,
      discrepancies: auditData.discrepancies || [],
      balance_amount: auditData.balance_amount,
      branch_id: new mongoose.Types.ObjectId(effectiveBranchId),
    });

    return audit.toObject();
  },

  async getAudit(hawb: string): Promise<IHAWBAudit> {
    const audit = await HAWBAudit.findOne({ hawb: hawb.toUpperCase() })
      .populate('shipment_id', '-__v')
      .populate('audited_by_id', 'name email')
      .lean<IHAWBAudit>();

    if (!audit) {
      throw createError('Audit not found', 404);
    }

    return audit as unknown as IHAWBAudit;
  },

  async updateAudit(
    hawb: string,
    updateData: {
      audit_status?: string;
      cartons_verified?: number;
      weight_variance?: number;
      remarks?: string;
      discrepancies?: string[];
      balance_amount?: number;
    }
  ): Promise<IHAWBAudit> {
    const audit = await HAWBAudit.findOne({ hawb: hawb.toUpperCase() });
    if (!audit) {
      throw createError('Audit not found', 404);
    }

    await HAWBAudit.findOneAndUpdate(
      { hawb: hawb.toUpperCase() },
      { $set: updateData },
      { new: true }
    );

    return this.getAudit(hawb);
  },
};
