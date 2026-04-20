import { Shipment, Invoice, HAWBAudit, Party } from '../models';

export const reportService = {
  async getDashboard(user: any) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query: any = {};
    if (user.role === 'customer') {
      const party = await Party.findOne({ email: user.email.toLowerCase() });
      if (!party) return { active_shipments: 0, delivered_today: 0, pending_audits: 0, exceptions: 0, revenue: { today: 0, week: 0, month: 0, total: 0 }, weekly_trend: [], status_distribution: {} };
      query.$or = [{ shipper_id: party._id }, { consignee_id: party._id }];
    } else if (user.role !== 'admin') {
      // For non-admin staff, filter by their branch
      if (user.branch_id) {
        query.branch_id = user.branch_id;
      }
    }

    // 1. Basic Counts
    const [activeShipments, deliveredToday, pendingAudits, exceptions] = await Promise.all([
      Shipment.countDocuments({ ...query, status: { $nin: ['delivered', 'cancelled'] } }),
      Shipment.countDocuments({ ...query, status: 'delivered', updated_at: { $gte: today, $lt: tomorrow } }),
      user.role === 'customer' ? 0 : HAWBAudit.countDocuments({ audit_status: 'pending', ...(query.branch_id ? { branch_id: query.branch_id } : {}) }),
      Shipment.countDocuments({ ...query, status: 'exception' }),
    ]);

    // 2. Total Metrics
    const { Branch } = (await import('../models')); // Use dynamic import to avoid circular dep if any
    const [totalShipments, totalInvoices, totalClients, totalBranches] = await Promise.all([
      Shipment.countDocuments(query),
      Invoice.countDocuments(user.role === 'customer' ? { billed_party_id: query.$or[0].shipper_id } : (query.branch_id ? { branch_id: query.branch_id } : {})),
      Party.countDocuments({ party_type: { $in: ['client', 'shipper'] } }), // Global counts for master data
      Branch.countDocuments({}), 
    ]);

    // 3. Revenue Data
    const billingQuery: any = user.role === 'customer' ? { billed_party_id: query.$or[0].shipper_id } : (query.branch_id ? { branch_id: query.branch_id } : {});
    const [revToday, revWeek, revMonth, revTotal] = await Promise.all([
      Invoice.aggregate([{ $match: { ...billingQuery, invoice_date: { $gte: today } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Invoice.aggregate([{ $match: { ...billingQuery, invoice_date: { $gte: weekAgo } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Invoice.aggregate([{ $match: { ...billingQuery, invoice_date: { $gte: monthAgo } } }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
      Invoice.aggregate([{ $match: billingQuery }, { $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    ]);

    // 4. Weekly Trend (last 7 days)
    const weeklyTrend = await Shipment.aggregate([
      { $match: { ...query, created_at: { $gte: weekAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days in trend
    const trendMap = new Map(weeklyTrend.map(t => [t._id, t.count]));
    const trendArray = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      trendArray.push({ day: dayName, count: trendMap.get(dayKey) || 0 });
    }

    // 5. Recent Activity (Shipment Updates)
    const { TrackingEvent } = (await import('../models'));
    const recentActivity = await TrackingEvent.find(user.role === 'customer' ? { shipment_id: { $in: await Shipment.find(query).distinct('_id') } } : (query.branch_id ? { branch_id: query.branch_id } : {}))
      .sort({ created_at: -1 })
      .limit(10)
      .populate({ path: 'shipment_id', select: 'hawb' })
      .lean();

    // 6. Status Distribution
    const distribution = await Shipment.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const status_distribution: Record<string, number> = {};
    distribution.forEach(d => { status_distribution[d._id] = d.count; });

    return {
      active_shipments: activeShipments,
      delivered_today: deliveredToday,
      pending_audits: pendingAudits,
      exceptions,
      total_shipments: totalShipments,
      total_invoices: totalInvoices,
      total_clients: totalClients,
      total_branches: totalBranches,
      revenue: {
        today: revToday[0]?.total || 0,
        week: revWeek[0]?.total || 0,
        month: revMonth[0]?.total || 0,
        total: revTotal[0]?.total || 0,
      },
      weekly_trend: trendArray,
      status_distribution,
      recent_activity: recentActivity.map((event: any) => ({
        time: event.created_at,
        action: `${event.status?.replace(/_/g, ' ')?.toUpperCase() || 'UPDATE'} - ${event.shipment_id?.hawb || 'N/A'}`,
        status: event.status === 'delivered' ? 'success' : event.status === 'exception' ? 'error' : 'info',
        remarks: event.remarks || '',
      })),
    };
  },

  async getShipmentReports(filters: {
    date_from?: string;
    date_to?: string;
    status?: string;
    service_type?: string;
  }, user: any) {
    const query: any = {};

    if (user.role === 'customer') {
      const party = await Party.findOne({ email: user.email.toLowerCase() });
      if (!party) return [];
      query.$or = [{ shipper_id: party._id }, { consignee_id: party._id }];
    }

    if (filters.date_from || filters.date_to) {
      query.created_at = {};
      if (filters.date_from) {
        query.created_at.$gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        query.created_at.$lte = new Date(filters.date_to);
      }
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.service_type) {
      query.service_type = filters.service_type;
    }

    const shipments = await Shipment.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
          total_weight: { $sum: '$total_weight' },
          total_value: { $sum: '$invoice_value' },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return shipments.map((item) => ({
      date: item._id,
      count: item.count,
      total_weight: item.total_weight,
      total_value: item.total_value,
    }));
  },

  async getBillingReports(filters: {
    date_from?: string;
    date_to?: string;
    payment_status?: string;
  }, user: any) {
    const query: any = {};

    if (user.role === 'customer') {
      const party = await Party.findOne({ email: user.email.toLowerCase() });
      if (!party) return [];
      query.billed_party_id = party._id;
    }

    if (filters.date_from || filters.date_to) {
      query.invoice_date = {};
      if (filters.date_from) {
        query.invoice_date.$gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        query.invoice_date.$lte = new Date(filters.date_to);
      }
    }
    if (filters.payment_status) {
      query.payment_status = filters.payment_status;
    }

    const reports = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoice_date' } },
          invoice_count: { $sum: 1 },
          total_subtotal: { $sum: '$subtotal' },
          total_tax: { $sum: '$tax_amount' },
          total_amount: { $sum: '$total_amount' },
          paid_amount: {
            $sum: {
              $cond: [{ $eq: ['$payment_status', 'paid'] }, '$total_amount', 0],
            },
          },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return reports.map((item) => ({
      date: item._id,
      invoice_count: item.invoice_count,
      total_subtotal: item.total_subtotal,
      total_tax: item.total_tax,
      total_amount: item.total_amount,
      paid_amount: item.paid_amount,
    }));
  },

  async getRevenueReports(filters: {
    date_from?: string;
    date_to?: string;
  }, user: any) {
    const query: any = {
      payment_status: 'paid',
    };

    if (user.role === 'customer') {
      const party = await Party.findOne({ email: user.email.toLowerCase() });
      if (!party) return [];
      query.billed_party_id = party._id;
    }

    if (filters.date_from || filters.date_to) {
      query.payment_date = {};
      if (filters.date_from) {
        query.payment_date.$gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        query.payment_date.$lte = new Date(filters.date_to);
      }
    }

    const revenue = await Invoice.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$payment_date' } },
          revenue: { $sum: '$total_amount' },
          invoice_count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    return revenue.map((item) => ({
      date: item._id,
      revenue: item.revenue,
      invoice_count: item.invoice_count,
    }));
  },

  async getPerformanceReports(filters: {
    date_from?: string;
    date_to?: string;
  }) {
    const query: any = {};

    if (filters.date_from || filters.date_to) {
      query.created_at = {};
      if (filters.date_from) {
        query.created_at.$gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        query.created_at.$lte = new Date(filters.date_to);
      }
    }

    const performance = await Shipment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avg_delivery_days: {
            $avg: {
              $cond: [
                { $ne: ['$actual_delivery_date', null] },
                {
                  $divide: [
                    { $subtract: ['$actual_delivery_date', '$created_at'] },
                    86400000,
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ]);

    return performance.map((item) => ({
      status: item._id,
      count: item.count,
      avg_delivery_days: item.avg_delivery_days || 0,
    }));
  },

  async getBranchRevenueReport(filters: {
    date_from?: string;
    date_to?: string;
    year?: string;
  }) {
    const { Branch } = await import('../models');

    const matchStage: any = {};

    // Apply year filter — default to current year
    const year = filters.year ? parseInt(filters.year) : new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);
    matchStage.invoice_date = { $gte: startOfYear, $lt: endOfYear };

    // Override with explicit date range if provided
    if (filters.date_from || filters.date_to) {
      matchStage.invoice_date = {};
      if (filters.date_from) matchStage.invoice_date.$gte = new Date(filters.date_from);
      if (filters.date_to) matchStage.invoice_date.$lte = new Date(filters.date_to);
    }

    // Aggregate: group by branch + month
    const raw = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            branch_id: '$branch_id',
            month: { $month: '$invoice_date' },
            year: { $year: '$invoice_date' },
          },
          total_revenue: { $sum: '$total_amount' },
          paid_revenue: { $sum: '$paid_amount' },
          invoice_count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, total_revenue: -1 } },
      {
        $lookup: {
          from: 'branches',
          localField: '_id.branch_id',
          foreignField: '_id',
          as: 'branch',
        },
      },
      { $unwind: { path: '$branch', preserveNullAndEmpty: true } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Gather all branches
    const branches = await Branch.find({}, 'name branch_code').lean();

    // Build a month-keyed structure: { 'Jan 2026': { branchName: revenue, ... } }
    const monthlyMap: Record<string, Record<string, number>> = {};
    const branchSet = new Set<string>();

    raw.forEach((item) => {
      const monthLabel = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      const branchName = item.branch?.name || 'Unassigned';
      branchSet.add(branchName);
      if (!monthlyMap[monthLabel]) monthlyMap[monthLabel] = {};
      monthlyMap[monthLabel][branchName] = (monthlyMap[monthLabel][branchName] || 0) + item.total_revenue;
    });

    // Also compute per-branch totals for ranking
    const branchTotals: Record<string, number> = {};
    raw.forEach((item) => {
      const branchName = item.branch?.name || 'Unassigned';
      branchTotals[branchName] = (branchTotals[branchName] || 0) + item.total_revenue;
    });

    const sortedBranches = [...branchSet].sort((a, b) => (branchTotals[b] || 0) - (branchTotals[a] || 0));

    return {
      months: Object.keys(monthlyMap),
      branches: sortedBranches,
      data: monthlyMap,
      branch_totals: branchTotals,
      year,
    };
  },
};
