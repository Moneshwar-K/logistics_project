import { Router } from 'express';
import { driverController } from '../controllers/driverController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require authentication
router.use(authenticateStaff);

// List assignments
router.get('/', driverController.listAssignments);

// Get driver assignments
router.get('/driver/:driverId', driverController.getDriverAssignments);

// Assign shipment to driver (operations, admin)
router.post(
  '/',
  authorizeStaff('admin', 'operations'),
  driverController.assignShipment
);

// Update assignment status (driver, operations, admin)
router.patch(
  '/:id/status',
  authorizeStaff('admin', 'operations', 'driver'),
  driverController.updateStatus
);

// Complete assignment (driver, operations, admin)
router.post(
  '/:id/complete',
  authorizeStaff('admin', 'operations', 'driver'),
  driverController.completeAssignment
);

export default router;

