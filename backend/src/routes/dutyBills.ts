import { Router } from 'express';
import { dutyBillController } from '../controllers/dutyBillController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require Staff authentication
router.use(authenticateStaff);

// List duty bills
router.get('/', dutyBillController.listDutyBills);

// Create duty bill (billing, admin)
router.post(
  '/',
  authorizeStaff('admin', 'billing'),
  dutyBillController.createDutyBill
);

// Get duty bill details
router.get('/:id', dutyBillController.getDutyBill);

export default router;
