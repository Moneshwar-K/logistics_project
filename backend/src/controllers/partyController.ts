import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { partyService } from '../services/partyService';

export const partyController = {
    async listParties(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { party_type, status, search, page, limit } = req.query;
            const result = await partyService.listParties({
                party_type: party_type as string,
                status: status as string,
                search: search as string,
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

    async getParty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const party = await partyService.getParty(req.params.id);
            res.json({ success: true, data: party, timestamp: new Date().toISOString() });
        } catch (error) {
            next(error);
        }
    },

    async createParty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const party = await partyService.createParty(req.body);
            res.status(201).json({
                success: true,
                data: party,
                message: 'Client created successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async updateParty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const party = await partyService.updateParty(req.params.id, req.body);
            res.json({
                success: true,
                data: party,
                message: 'Client updated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteParty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            await partyService.deleteParty(req.params.id);
            res.json({
                success: true,
                message: 'Client deactivated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },
};
