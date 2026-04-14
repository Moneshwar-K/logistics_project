import { Router } from 'express';
import { operationController } from '../controllers/operationController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require Staff authentication
router.use(authenticateStaff);

// Update operation status (operations, admin only)
router.post(
  '/status-update',
  authorizeStaff('admin', 'operations'),
  operationController.updateStatus
);

// Get operation history
router.get('/history/:shipmentId', operationController.getHistory);

export default router;

