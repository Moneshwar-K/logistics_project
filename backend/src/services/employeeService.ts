import { createError } from '../middleware/errorHandler';
import { Employee, IEmployee } from '../models';

export const employeeService = {
    async listEmployees(filters: {
        branch_id?: string;
        department?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ data: IEmployee[]; total: number; page: number; limit: number }> {
        const { branch_id, department, status = 'active', search, page = 1, limit = 50 } = filters;
        const query: any = {};

        if (branch_id) query.branch_id = branch_id;
        if (department) query.department = department;
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { employee_code: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            Employee.find(query)
                .populate('branch_id', 'name code')
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean<IEmployee[]>(),
            Employee.countDocuments(query),
        ]);

        return { data: data as unknown as IEmployee[], total, page, limit };
    },

    async getEmployee(id: string): Promise<IEmployee> {
        const employee = await Employee.findById(id)
            .populate('branch_id', 'name code')
            .lean<IEmployee>();
        if (!employee) throw createError('Employee not found', 404);
        return employee as unknown as IEmployee;
    },

    async createEmployee(data: Partial<IEmployee>): Promise<IEmployee> {
        if (data.employee_code) {
            const existing = await Employee.findOne({ employee_code: data.employee_code.toUpperCase() });
            if (existing) throw createError('Employee with this code already exists', 400);
        }

        if (data.email) {
            const existing = await Employee.findOne({ email: data.email.toLowerCase() });
            if (existing) throw createError('Employee with this email already exists', 400);
        }

        const employee = await Employee.create({
            ...data,
            employee_code: data.employee_code?.toUpperCase(),
        });
        return employee.toObject() as unknown as IEmployee;
    },

    async updateEmployee(id: string, data: Partial<IEmployee>): Promise<IEmployee> {
        const employee = await Employee.findById(id);
        if (!employee) throw createError('Employee not found', 404);

        if (data.employee_code && data.employee_code.toUpperCase() !== employee.employee_code) {
            const existing = await Employee.findOne({ employee_code: data.employee_code.toUpperCase() });
            if (existing) throw createError('Employee with this code already exists', 400);
        }

        if (data.email && data.email.toLowerCase() !== employee.email) {
            const existing = await Employee.findOne({ email: data.email.toLowerCase() });
            if (existing) throw createError('Employee with this email already exists', 400);
        }

        if (data.employee_code) data.employee_code = data.employee_code.toUpperCase();

        await Employee.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
        return this.getEmployee(id);
    },

    async deleteEmployee(id: string): Promise<IEmployee> {
        const employee = await Employee.findById(id);
        if (!employee) throw createError('Employee not found', 404);

        await Employee.findByIdAndUpdate(id, { $set: { status: 'inactive' } });
        return this.getEmployee(id);
    },
};
