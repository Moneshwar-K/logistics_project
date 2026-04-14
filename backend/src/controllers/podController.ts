import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { podService } from '../services/podService';
import path from 'path';

export const podController = {
  async listPODs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filters = req.query;
      const result = await podService.listPODs(filters, page, limit);

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

  async createPOD(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const podData = req.body;
      const pod = await podService.createPOD(podData, req.user.id, req.user.branch_id);

      res.status(201).json({
        success: true,
        data: pod,
        message: 'POD created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getPOD(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const pod = await podService.getPOD(shipmentId);

      res.json({
        success: true,
        data: pod,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadPODFiles(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw createError('Authentication required', 401);
      }

      const { shipmentId } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const upload = await podService.uploadPODFiles(shipmentId, files, req.user.id);

      res.status(201).json({
        success: true,
        data: upload,
        message: 'POD files uploaded successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadPOD(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const filePath = podService.getPODFilePath(shipmentId);
      res.download(filePath);
    } catch (error) {
      next(error);
    }
  },
};

