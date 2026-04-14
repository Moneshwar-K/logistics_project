import express from 'express';
import { billingController } from '../controllers/billingController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/calculate', authenticate, billingController.calculate);
router.get('/invoices/:id/pdf', authenticate, billingController.generateInvoice);

export default router;
