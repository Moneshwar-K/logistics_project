import { Router } from 'express';
import { auditController } from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get audit dashboard (admin, operations)
router.get(
  '/dashboard',
  authorize('admin', 'operations'),
  auditController.getDashboard
);

// List HAWB audits
router.get('/hawbs', auditController.listHAWBAudits);

// Create audit (admin, operations)
router.post(
  '/hawbs/:hawb',
  authorize('admin', 'operations'),
  auditController.createAudit
);

// Get audit
router.get('/hawbs/:hawb', auditController.getAudit);

// Update audit (admin, operations)
router.patch(
  '/hawbs/:hawb',
  authorize('admin', 'operations'),
  auditController.updateAudit
);

export default router;

