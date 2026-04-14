import { Router } from 'express';
import { trackingController } from '../controllers/trackingController';
import { authenticate } from '../middleware/auth';
import { authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// Public route - quick tracking
router.get('/quick', trackingController.quickTracking);

// Protected routes
router.use(authenticate);

// Get tracking details
router.get('/:shipmentId', trackingController.getTrackingDetails);

// Create tracking event (operations, admin only)
router.post(
  '/:shipmentId/events',
  authorizeStaff('admin', 'operations'),
  trackingController.createTrackingEvent
);

// Get tracking history
router.get('/:shipmentId/history', trackingController.getTrackingHistory);

export default router;

