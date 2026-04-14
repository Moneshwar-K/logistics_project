import express from 'express';
import { manifestController } from '../controllers/manifestController';
import { authenticateStaff } from '../middleware/staffAuth';

const router = express.Router();

router.use(authenticateStaff);

router.post('/', manifestController.create);
router.get('/', manifestController.list);
router.get('/:id', manifestController.getOne);
router.patch('/:id/dispatch', manifestController.dispatch);
router.patch('/:id/receive', manifestController.receive);

export default router;
