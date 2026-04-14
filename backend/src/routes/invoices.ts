import { Router } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require Staff authentication
router.use(authenticateStaff);

// List invoices
router.get('/', invoiceController.listInvoices);

// Generate invoice (operations, finance, admin)
router.post(
  '/generate',
  authorizeStaff('admin', 'operations', 'finance'),
  invoiceController.generateInvoice
);

// Create invoice
router.post(
  '/',
  authorizeStaff('admin', 'operations', 'finance'),
  invoiceController.createInvoice
);

// Get invoice
router.get('/:id', invoiceController.getInvoice);

// Update invoice (finance, admin)
router.patch(
  '/:id',
  authorizeStaff('admin', 'finance'),
  invoiceController.updateInvoice
);

// Record payment (finance, admin)
router.post(
  '/:id/payment',
  authorizeStaff('admin', 'finance'),
  invoiceController.recordPayment
);

// Download PDF
router.get('/:id/pdf', invoiceController.downloadPDF);

export default router;

