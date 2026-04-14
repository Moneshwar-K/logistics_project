import { Router } from 'express';
import { serviceTypeController } from '../controllers/serviceTypeController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

router.use(authenticateStaff);

// List service types
router.get('/', serviceTypeController.listServiceTypes);

// Get single service type
router.get('/:id', serviceTypeController.getServiceType);

// Create service type (admin only)
router.post('/', authorizeStaff('admin'), serviceTypeController.createServiceType);

// Update service type (admin only)
router.patch('/:id', authorizeStaff('admin'), serviceTypeController.updateServiceType);

// Delete (soft) service type (admin only)
router.delete('/:id', authorizeStaff('admin'), serviceTypeController.deleteServiceType);

export default router;
