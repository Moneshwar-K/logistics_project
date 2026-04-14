import { Router } from 'express';
import { rateController } from '../controllers/rateController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// Retrieve rates (open to authenticated staff)
router.use(authenticateStaff);

router.get('/', rateController.listRates);
router.get('/:id', rateController.getRate);
router.post('/lookup', rateController.lookupRate);

// Manage rates (admin only)
router.post('/', authorizeStaff('admin'), rateController.createRate);
router.patch('/:id', authorizeStaff('admin'), rateController.updateRate);
router.delete('/:id', authorizeStaff('admin'), rateController.deleteRate);

export default router;
