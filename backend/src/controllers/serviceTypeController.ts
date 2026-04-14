import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { serviceTypeService } from '../services/serviceTypeService';

export const serviceTypeController = {
    async listServiceTypes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { mode, status, page, limit } = req.query;
            const result = await serviceTypeService.listServiceTypes({
                mode: mode as string,
                status: status as string,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });

            res.json({
                success: true,
                data: result.data,
                pagination: { total: result.total, page: result.page, limit: result.limit },
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async getServiceType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const st = await serviceTypeService.getServiceType(req.params.id);
            res.json({ success: true, data: st, timestamp: new Date().toISOString() });
        } catch (error) {
            next(error);
        }
    },

    async createServiceType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const st = await serviceTypeService.createServiceType(req.body);
            res.status(201).json({
                success: true,
                data: st,
                message: 'Service type created successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async updateServiceType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const st = await serviceTypeService.updateServiceType(req.params.id, req.body);
            res.json({
                success: true,
                data: st,
                message: 'Service type updated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteServiceType(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            await serviceTypeService.deleteServiceType(req.params.id);
            res.json({
                success: true,
                message: 'Service type deactivated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },
};
