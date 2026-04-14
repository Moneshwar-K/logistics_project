import { Request, Response } from 'express';
import { pickupService } from '../services/pickupService';

export const pickupController = {
    create: async (req: Request, res: Response) => {
        try {
            // Auto-assign branch from user session if not provided (assuming middleware populates req.user)
            if (!req.body.branch_id && (req as any).user?.branch_id) {
                req.body.branch_id = (req as any).user.branch_id;
            }
            const data = await pickupService.createPickup(req.body);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    list: async (req: Request, res: Response) => {
        try {
            const result = await pickupService.getPickups(req.query);
            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const data = await pickupService.updatePickup(req.params.id, req.body);
            if (!data) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    delete: async (req: Request, res: Response) => {
        // Typically just cancel, not delete
        try {
            const data = await pickupService.updatePickup(req.params.id, { status: 'cancelled' });
            if (!data) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            res.json({ success: true, message: 'Pickup cancelled' });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
