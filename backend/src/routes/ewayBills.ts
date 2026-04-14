import { Router } from 'express';
import { ewayBillController } from '../controllers/ewayBillController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require Staff authentication
router.use(authenticateStaff);

// List e-way bills
router.get('/', ewayBillController.listEWayBills);

// Create e-way bill (operations, admin)
router.post(
  '/',
  authorizeStaff('admin', 'operations'),
  ewayBillController.createEWayBill
);

// Get e-way bill
router.get('/:id', ewayBillController.getEWayBill);

// Update e-way bill (operations, admin)
router.patch(
  '/:id',
  authorizeStaff('admin', 'operations'),
  ewayBillController.updateEWayBill
);

// Cancel e-way bill (operations, admin)
router.post(
  '/:id/cancel',
  authorizeStaff('admin', 'operations'),
  ewayBillController.cancelEWayBill
);

// Get e-way bill status
router.get('/:id/status', ewayBillController.getStatus);

export default router;

