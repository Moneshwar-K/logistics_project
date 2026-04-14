import { createError } from '../middleware/errorHandler';
import { Invoice, Charge, IInvoice } from '../models';
import { Shipment } from '../models';
import mongoose from 'mongoose';
import { getNextSequence } from '../utils/sequenceGenerator';
import { billingService } from './billingService';

function calculateTax(
  amount: number,
  shipperState: string,
  consigneeState: string
): { igst: number; cgst: number; sgst: number; total: number } {
  const taxRate = 18; // 18% GST

  // Inter-state: IGST
  if (shipperState.toLowerCase() !== consigneeState.toLowerCase()) {
    const igst = (amount * taxRate) / 100;
    return { igst, cgst: 0, sgst: 0, total: amount + igst };
  }

  // Intra-state: CGST + SGST
  const cgst = (amount * (taxRate / 2)) / 100; // 9%
  const sgst = (amount * (taxRate / 2)) / 100; // 9%
  return { igst: 0, cgst, sgst, total: amount + cgst + sgst };
}

export const invoiceService = {
  async createInvoice(
    shipmentIdsInput: string | string[],
    createdById: string,
    branchId: string
  ): Promise<IInvoice> {
    const ids = Array.isArray(shipmentIdsInput) ? shipmentIdsInput : [shipmentIdsInput];
    
    if (ids.length === 0) {
      throw createError('At least one shipment ID is required', 400);
    }

    // Get all shipments
    const shipments = await Shipment.find({ _id: { $in: ids } })
      .populate('shipper_id')
      .populate('consignee_id')
      .lean();

    if (shipments.length === 0) {
      throw createError('No valid shipments found', 404);
    }

    // Check if any shipment already has an invoice (optional, but good practice)
    const existing = await Invoice.findOne({ 
      $or: [
        { shipment_id: { $in: ids } },
        { shipment_ids: { $in: ids } }
      ]
    });
    if (existing) {
      throw createError('One or more shipments already have an invoice', 400);
    }

    // Generate invoice number
    const invoice_number = await getNextSequence('invoice', 'INV');

    // Aggregate charges and tax
    let totalSubtotal = 0;
    let totalTax = 0;
    let totalIGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    const chargeItems: any[] = [];

    for (const shipment of shipments) {
      const charges = await billingService.calculateCharges(shipment as any);
      
      const shipperState = (shipment.shipper_id as any)?.state || '';
      const consigneeState = (shipment.consignee_id as any)?.state || '';
      const tax = calculateTax(charges.total, shipperState, consigneeState);

      totalSubtotal += charges.total;
      totalTax += (tax.igst + tax.cgst + tax.sgst);
      totalIGST += tax.igst;
      totalCGST += tax.cgst;
      totalSGST += tax.sgst;

      // Prepare charge items for this shipment
      const shipmentId = shipment._id;
      
      if (charges.freight > 0) {
        chargeItems.push({
          shipment_id: shipmentId,
          description: `Freight Charges (${shipment.hawb} - ${charges.weight_charged} kg)`,
          charge_type: 'freight',
          quantity: 1,
          unit_price: charges.freight,
          amount: charges.freight,
          hsn_code: '996511',
        });
      }

      if (charges.fuel_surcharge > 0) {
        chargeItems.push({
          shipment_id: shipmentId,
          description: `Fuel Surcharge (${shipment.hawb})`,
          charge_type: 'surcharge',
          quantity: 1,
          unit_price: charges.fuel_surcharge,
          amount: charges.fuel_surcharge,
          hsn_code: '996511',
        });
      }

      if (charges.docket_charge > 0) {
        chargeItems.push({
          shipment_id: shipmentId,
          description: `Docket Charge (${shipment.hawb})`,
          charge_type: 'docket',
          quantity: 1,
          unit_price: charges.docket_charge,
          amount: charges.docket_charge,
          hsn_code: '996511',
        });
      }
    }

    // Create consolidated invoice
    const invoice = await Invoice.create({
      invoice_number,
      shipment_id: shipments[0]._id, // Main reference (keep for legacy)
      shipment_ids: ids.map(id => new mongoose.Types.ObjectId(id)),
      billed_party_id: shipments[0].shipper_id, // Default to first shipper
      invoice_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      subtotal: totalSubtotal,
      tax_percentage: 18,
      tax_amount: totalTax,
      igst: totalIGST,
      cgst: totalCGST,
      sgst: totalSGST,
      total_amount: totalSubtotal + totalTax,
      payment_status: 'pending',
      created_by_id: new mongoose.Types.ObjectId(createdById),
      branch_id: new mongoose.Types.ObjectId(branchId),
    });

    // Add invoice_id to all charge items
    const finalCharges = chargeItems.map(c => ({ ...c, invoice_id: invoice._id }));
    await Charge.insertMany(finalCharges);

    return this.getInvoiceById(invoice._id.toString());
  },

  async getInvoiceById(invoiceId: string): Promise<IInvoice> {
    const invoice = await Invoice.findById(invoiceId)
      .populate('shipment_id')
      .populate('billed_party_id')
      .populate('created_by_id', 'name email')
      .lean();

    if (!invoice) {
      throw createError('Invoice not found', 404);
    }

    // Get charges
    const charges = await Charge.find({ invoice_id: invoiceId }).lean();

    // manual cast to allow adding charges prop
    return {
      ...invoice,
      charges
    } as any;
  },

  async recordPayment(id: string, paymentData: { amount: number; payment_method: string; payment_date: string; notes?: string }) {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw createError('Invoice not found', 404);

    const amount = Number(paymentData.amount);

    // Update invoice payment details
    invoice.paid_amount = (invoice.paid_amount || 0) + amount;
    invoice.balance_amount = invoice.total_amount - invoice.paid_amount;

    if (invoice.balance_amount <= 0.01) { // Floating point tolerance
      invoice.payment_status = 'paid';
      invoice.balance_amount = 0;
    } else {
      invoice.payment_status = 'partial';
    }

    invoice.last_payment_date = new Date(paymentData.payment_date);
    invoice.payment_method = paymentData.payment_method as any;

    // Add to history (if we had a history field, but for now just updating main fields)
    // invoice.payment_history.push(...)

    await invoice.save();
    return this.getInvoiceById(id);
  },

  // ... rest of the existing methods (list, payment) needing updates for new fields ...

  async listInvoices(filters: any, page: number, limit: number) {
    const query: any = {};

    if (filters.payment_status) {
      query.payment_status = filters.payment_status;
    }
    // ... date filters ...

    const total = await Invoice.countDocuments(query);
    const offset = (page - 1) * limit;

    const data = await Invoice.find(query)
      .populate('shipment_id', 'hawb')
      .populate('billed_party_id', 'name email')
      .populate('created_by_id', 'name email')
      .sort({ invoice_date: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

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

  // Update invoice with automatic total recalculation when charges change
  async updateInvoice(id: string, updateData: Partial<IInvoice>, charges?: any[]) {
    const invoice = await Invoice.findById(id).populate('shipment_id');
    if (!invoice) throw createError('Invoice not found', 404);

    // Apply field updates (excluding financial fields if charges are being replaced)
    const fieldsToUpdate = { ...updateData };

    if (charges) {
      // Replace charges
      await Charge.deleteMany({ invoice_id: id });
      const newCharges = charges.map(c => ({ ...c, invoice_id: id }));
      await Charge.insertMany(newCharges);

      // Recalculate subtotal from new charges
      const subtotal = newCharges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      // Get shipment for tax calculation
      const shipment = await Shipment.findById(invoice.shipment_id)
        .populate('shipper_id')
        .populate('consignee_id')
        .lean();

      const shipperState = (shipment?.shipper_id as any)?.state || '';
      const consigneeState = (shipment?.consignee_id as any)?.state || '';
      const tax = calculateTax(subtotal, shipperState, consigneeState);

      fieldsToUpdate.subtotal = subtotal;
      fieldsToUpdate.tax_amount = tax.igst + tax.cgst + tax.sgst;
      fieldsToUpdate.igst = tax.igst;
      fieldsToUpdate.cgst = tax.cgst;
      fieldsToUpdate.sgst = tax.sgst;
      fieldsToUpdate.total_amount = tax.total;

      // Recalculate balance if there were prior payments
      if (invoice.paid_amount && invoice.paid_amount > 0) {
        fieldsToUpdate.balance_amount = tax.total - invoice.paid_amount;
      }
    }

    const updated = await Invoice.findByIdAndUpdate(id, fieldsToUpdate, { new: true });
    if (!updated) throw createError('Invoice not found', 404);

    return this.getInvoiceById(id);
  }
};
