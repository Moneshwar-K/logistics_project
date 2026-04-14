import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { employeeService } from '../services/employeeService';

export const employeeController = {
    async listEmployees(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { branch_id, department, status, search, page, limit } = req.query;
            const result = await employeeService.listEmployees({
                branch_id: branch_id as string,
                department: department as string,
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

    async getEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const employee = await employeeService.getEmployee(req.params.id);
            res.json({ success: true, data: employee, timestamp: new Date().toISOString() });
        } catch (error) {
            next(error);
        }
    },

    async createEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const employee = await employeeService.createEmployee(req.body);
            res.status(201).json({
                success: true,
                data: employee,
                message: 'Employee created successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async updateEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const employee = await employeeService.updateEmployee(req.params.id, req.body);
            res.json({
                success: true,
                data: employee,
                message: 'Employee updated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteEmployee(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            await employeeService.deleteEmployee(req.params.id);
            res.json({
                success: true,
                message: 'Employee deactivated successfully',
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            next(error);
        }
    },
};
