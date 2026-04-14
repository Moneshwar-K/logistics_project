import express from 'express';
import { getMyNotifications, markAsRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/read', markAsRead);

export default router;
