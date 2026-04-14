import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { branchService } from '../services/branchService';

export const branchController = {
  async listBranches(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, branch_type, status, page, limit } = req.query as Record<string, string>;
      const branches = await branchService.listBranches({
        search,
        branch_type,
        status: status || 'active',
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 100,
      });
      
      res.json({
        success: true,
        data: branches,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async getBranch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const branch = await branchService.getBranch(id);
      
      res.json({
        success: true,
        data: branch,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async createBranch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const branchData = req.body;
      const branch = await branchService.createBranch(branchData);
      
      res.status(201).json({
        success: true,
        data: branch,
        message: 'Branch created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateBranch(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const branch = await branchService.updateBranch(id, updateData);
      
      res.json({
        success: true,
        data: branch,
        message: 'Branch updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
};
