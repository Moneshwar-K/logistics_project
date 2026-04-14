import { Router } from 'express';
import { shipmentController } from '../controllers/shipmentController';
import { authenticate } from '../middleware/auth';
import { authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard stats
router.get('/stats', shipmentController.getStats);

// Get all shipments (with filters)
router.get('/', shipmentController.listShipments);

// Get shipment by HAWB
router.get('/hawb/:hawb', shipmentController.getShipmentByHAWB);

// Search shipments (alias for list with search query)
router.get('/search', shipmentController.listShipments);

// Get single shipment
router.get('/:id', shipmentController.getShipment);

// Create shipment (operations, admin only)
router.post(
  '/',
  authorizeStaff('admin', 'operations'),
  shipmentController.createShipment
);

// Update shipment (operations, admin only)
router.patch(
  '/:id',
  authorizeStaff('admin', 'operations'),
  shipmentController.updateShipment
);

// Update POD (operations, admin only)
router.patch(
  '/:id/pod',
  authorizeStaff('admin', 'operations'),
  shipmentController.updatePOD
);

// Delete shipment (admin only)
router.delete(
  '/:id',
  authorizeStaff('admin'),
  shipmentController.deleteShipment
);

export default router;

