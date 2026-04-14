import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification } from '../models/Notification';
import { createError } from '../middleware/errorHandler';

// Get notifications for the current user
export const getMyNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw createError('Unauthorized', 401);

        const limit = parseInt(req.query.limit as string) || 20;

        // Support tracking last read time or basic unread count
        const notifications = await Notification.find({ user_id: userId })
            .sort({ created_at: -1 })
            .limit(limit);

        // Get unread count
        const unreadCount = await Notification.countDocuments({ user_id: userId, is_read: false });

        res.json({
            success: true,
            data: { notifications, unreadCount },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
};

// Mark notifications as read
export const markAsRead = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) throw createError('Unauthorized', 401);

        const { notificationIds } = req.body;

        if (notificationIds && Array.isArray(notificationIds)) {
            await Notification.updateMany(
                { user_id: userId, _id: { $in: notificationIds } },
                { $set: { is_read: true } }
            );
        } else {
            // Mark all as read
            await Notification.updateMany(
                { user_id: userId, is_read: false },
                { $set: { is_read: true } }
            );
        }

        res.json({
            success: true,
            message: 'Notifications marked as read',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
};
