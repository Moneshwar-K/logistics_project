import express from 'express';
import { pickupController } from '../controllers/pickupController';
import { authenticate, authorize } from '../middleware/auth'; // Assuming auth middleware exists

const router = express.Router();

router.use(authenticate); // Protect all routes

router.post('/', pickupController.create);
router.get('/', pickupController.list);
router.patch('/:id', pickupController.update);
router.delete('/:id', pickupController.delete);

export default router;
