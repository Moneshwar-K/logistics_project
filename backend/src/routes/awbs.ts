import { Router } from 'express';
import { awbController } from '../controllers/awbController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List/Get
router.get('/', awbController.listAwbs);
router.get('/:id', awbController.getAwb);

// Create/Update (Operations/Admin)
router.post('/', authorize('admin', 'operations'), awbController.createAwb);
router.patch('/:id', authorize('admin', 'operations'), awbController.updateAwb);

// Manage Shipments in AWB
router.post('/:id/shipments', authorize('admin', 'operations'), awbController.addShipments);
router.delete('/:id/shipments', authorize('admin', 'operations'), awbController.removeShipment);

export default router;
