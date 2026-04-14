import { Router } from 'express';
import { organizationController } from '../controllers/organizationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get organization settings
router.get('/', organizationController.getOrganization);

// Update organization settings (admin only)
router.put('/', authorize('admin'), organizationController.updateOrganization);

export default router;
