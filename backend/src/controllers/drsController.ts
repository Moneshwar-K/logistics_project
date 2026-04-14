import { Request, Response } from 'express';
import { drsService } from '../services/drsService';

export const drsController = {
    create: async (req: Request, res: Response) => {
        try {
            if (!req.body.branch_id && (req as any).user?.branch_id) {
                req.body.branch_id = (req as any).user.branch_id;
            }
            req.body.created_by_id = (req as any).user?._id;

            const data = await drsService.createDRS(req.body);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    list: async (req: Request, res: Response) => {
        try {
            const result = await drsService.getDRS(req.query);
            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getOne: async (req: Request, res: Response) => {
        try {
            const data = await drsService.getDRSById(req.params.id);
            if (!data) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    markOut: async (req: Request, res: Response) => {
        try {
            const data = await drsService.markOutForDelivery(req.params.id);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
