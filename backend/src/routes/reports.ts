import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require authentication
router.use(authenticateStaff);

// Get dashboard KPIs (admin, operations, finance, customer)
router.get(
  '/dashboard',
  authorizeStaff('admin', 'operations', 'finance', 'customer'),
  reportController.getDashboard
);

// Get shipment reports
router.get(
  '/shipments',
  authorizeStaff('admin', 'operations', 'customer'),
  reportController.getShipmentReports
);

// Get billing reports (admin, finance)
router.get(
  '/billing',
  authorizeStaff('admin', 'finance', 'customer'),
  reportController.getBillingReports
);

// Get revenue reports (admin, finance, customer)
router.get(
  '/revenue',
  authorizeStaff('admin', 'finance', 'customer'),
  reportController.getRevenueReports
);

// Get performance reports (admin, operations)
router.get(
  '/performance',
  authorizeStaff('admin', 'operations'),
  reportController.getPerformanceReports
);

// Get branch revenue analytics by month (admin, finance)
router.get(
  '/branch-revenue',
  authorizeStaff('admin', 'finance'),
  reportController.getBranchRevenue
);

export default router;

