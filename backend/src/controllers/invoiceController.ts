import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { invoiceService } from '../services/invoiceService';
import { pdfService } from '../services/pdfService';

export const invoiceController = {
  async listInvoices(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await invoiceService.listInvoices(filters, page, limit);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async generateInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId, shipment_ids } = req.body;
      
      // Get the IDs (prefer plural shipment_ids from body)
      const targetIds = shipment_ids || shipmentId;

      if (!targetIds || (Array.isArray(targetIds) && targetIds.length === 0)) {
        res.status(400).json({ success: false, message: 'At least one Shipment ID is required' });
        return;
      }

      const invoice = await invoiceService.createInvoice(
        targetIds,
        req.user?.id || '',
        req.user?.branch_id || ''
      );

      res.status(201).json({
        success: true,
        data: invoice,
        message: 'Invoice generated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async createInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    // Deprecated in favor of generateInvoice for now, or redir to it
    invoiceController.generateInvoice(req, res, next);
  },

  async getInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoiceById(id);

      res.json({
        success: true,
        data: invoice,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateInvoice(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const invoice = await invoiceService.updateInvoice(id, updateData);

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async recordPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const paymentData = req.body;
      // @ts-ignore - Implement recordPayment in service next
      const invoice = await invoiceService.recordPayment(id, paymentData);

      res.json({
        success: true,
        data: invoice,
        message: 'Payment recorded successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadPDF(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await pdfService.generateInvoicePDF(id, res);
    } catch (error) {
      next(error);
    }
  },
};

