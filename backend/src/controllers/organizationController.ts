import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { organizationService } from '../services/organizationService';

export const organizationController = {
    async getOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const org = await organizationService.getOrganization();
            res.json({
                success: true,
                data: org,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async updateOrganization(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const org = await organizationService.updateOrganization(req.body);
            res.json({
                success: true,
                data: org,
                message: 'Organization settings updated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },
};
