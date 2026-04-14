import { Request, Response } from 'express';
import { billingService } from '../services/billingService';
import { pdfService } from '../services/pdfService';
import { Shipment } from '../models/Shipment';
import { logger } from '../utils/logger';

export const billingController = {
    // POST /api/billing/calculate
    // Body: { shipment_id: string } OR { weight: number, service_type: string, ... } (Draft calculation)
    calculate: async (req: Request, res: Response): Promise<void> => {
        try {
            const { shipment_id } = req.body;

            if (!shipment_id) {
                res.status(400).json({ message: 'Shipment ID is required' });
                return;
            }

            const shipment = await Shipment.findById(shipment_id);
            if (!shipment) {
                res.status(404).json({ message: 'Shipment not found' });
                return;
            }

            const charges = await billingService.calculateCharges(shipment);
            res.status(200).json({ success: true, data: charges });

        } catch (error: any) {
            logger.error('Billing calculation error:', error);
            res.status(500).json({ message: error.message || 'Error calculating charges' });
        }
    },

    // GET /api/billing/invoices/:id/pdf
    generateInvoice: async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            await pdfService.generateInvoicePDF(id, res);
        } catch (error: any) {
            logger.error('PDF Generation Error:', error);
            res.status(500).json({ message: error.message || 'Error generating PDF' });
        }
    }
};
