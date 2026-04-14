import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { reportService } from '../services/reportService';

const router = Router();
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Unified statistics from centralized report service
 */
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const statsData = await reportService.getDashboard(user);

        res.json({
            success: true,
            data: statsData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        next(error);
    }
});

export default router;
