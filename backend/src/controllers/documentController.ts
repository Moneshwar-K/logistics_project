import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { documentService } from '../services/documentService';
import path from 'path';

export const documentController = {
  async listAllDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const filters = req.query;
      const result = await documentService.listAllDocuments(filters, page, limit);

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

  async getShipmentDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const documents = await documentService.getShipmentDocuments(shipmentId);

      res.json({
        success: true,
        data: documents,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shipmentId } = req.params;
      const file = req.file;
      const { document_type } = req.body;

      if (!file) {
        throw new Error('File is required');
      }

      const document = await documentService.uploadDocument(
        shipmentId,
        file,
        document_type,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await documentService.getDocument(id);

      res.json({
        success: true,
        data: document,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await documentService.deleteDocument(id);

      res.json({
        success: true,
        message: 'Document deleted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const filePath = await documentService.getDocumentPath(id);
      res.download(filePath);
    } catch (error) {
      next(error);
    }
  },

  async searchDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const documents = await documentService.searchDocuments(filters as any);

      res.json({
        success: true,
        data: documents,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
