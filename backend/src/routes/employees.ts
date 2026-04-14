import { Router } from 'express';
import { employeeController } from '../controllers/employeeController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

router.use(authenticateStaff);

// List employees
router.get('/', employeeController.listEmployees);

// Get single employee
router.get('/:id', employeeController.getEmployee);

// Create employee (admin only)
router.post('/', authorizeStaff('admin'), employeeController.createEmployee);

// Update employee (admin only)
router.patch('/:id', authorizeStaff('admin'), employeeController.updateEmployee);

// Delete (soft) employee (admin only)
router.delete('/:id', authorizeStaff('admin'), employeeController.deleteEmployee);

export default router;
