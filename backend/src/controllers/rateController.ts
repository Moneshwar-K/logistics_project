import { Request, Response, NextFunction } from 'express';
import { rateService } from '../services/rateService';

export const rateController = {
    // Create rate (admin only)
    createRate: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rate = await rateService.createRate(req.body);
            res.status(201).json({ success: true, data: rate });
        } catch (error) {
            next(error);
        }
    },

    // List rates
    listRates: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const filters = {
                service_type_id: req.query.service_type_id as string,
                origin_zone: req.query.origin_zone as string,
                destination_zone: req.query.destination_zone as string,
                status: req.query.status as string,
            };

            const result = await rateService.listRates(filters, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            next(error);
        }
    },

    // Get rate by ID
    getRate: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rate = await rateService.getRateById(req.params.id);
            res.json({ success: true, data: rate });
        } catch (error) {
            next(error);
        }
    },

    // Update rate (admin only)
    updateRate: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rate = await rateService.updateRate(req.params.id, req.body);
            res.json({ success: true, data: rate });
        } catch (error) {
            next(error);
        }
    },

    // Delete rate (admin only)
    deleteRate: async (req: Request, res: Response, next: NextFunction) => {
        try {
            await rateService.deleteRate(req.params.id);
            res.json({ success: true, message: 'Rate deactivated successfully' });
        } catch (error) {
            next(error);
        }
    },

    // Usage: POST /api/rates/lookup { service_type_id, origin_zone, destination_zone, weight }
    lookupRate: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { service_type_id, origin_zone, destination_zone, weight } = req.body;

            if (!service_type_id || !origin_zone || !destination_zone || weight === undefined) {
                res.status(400).json({ success: false, message: 'Missing required parameters' });
                return;
            }

            const rate = await rateService.lookupRate({
                service_type_id,
                origin_zone,
                destination_zone,
                weight: Number(weight)
            });

            if (!rate) {
                res.status(404).json({ success: false, message: 'No matching rate found for this weight slab' });
                return;
            }

            res.json({ success: true, data: rate });
        } catch (error) {
            next(error);
        }
    }
};
