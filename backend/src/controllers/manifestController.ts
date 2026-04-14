import { Request, Response } from 'express';
import { manifestService } from '../services/manifestService';

export const manifestController = {
    create: async (req: Request, res: Response) => {
        try {
            if (!req.body.origin_branch_id && (req as any).user?.branch_id) {
                req.body.origin_branch_id = (req as any).user.branch_id;
            }
            req.body.created_by_id = (req as any).user?._id;

            const data = await manifestService.createManifest(req.body);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    list: async (req: Request, res: Response) => {
        try {
            const result = await manifestService.getManifests(req.query);
            res.json({ success: true, ...result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getOne: async (req: Request, res: Response) => {
        try {
            const data = await manifestService.getManifestById(req.params.id);
            if (!data) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    dispatch: async (req: Request, res: Response) => {
        try {
            const data = await manifestService.dispatchManifest(req.params.id);
            if (!data) {
                res.status(404).json({ success: false, message: 'Not found' });
                return;
            }
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    receive: async (req: Request, res: Response) => {
        try {
            const data = await manifestService.receiveManifest(req.params.id);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
