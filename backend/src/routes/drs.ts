import express from 'express';
import { drsController } from '../controllers/drsController';
import { authenticateStaff } from '../middleware/staffAuth';

const router = express.Router();

router.use(authenticateStaff);

router.post('/', drsController.create);
router.get('/', drsController.list);
router.get('/:id', drsController.getOne);
router.patch('/:id/out-for-delivery', drsController.markOut);

export default router;
