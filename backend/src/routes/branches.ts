import { Router } from 'express';
import { branchController } from '../controllers/branchController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// List branches (Internal Staff / Public for signup check if needed)
router.get('/', branchController.listBranches);

// All other routes require Staff authentication
router.use(authenticateStaff);

// Get branch
router.get('/:id', branchController.getBranch);

// Create branch (admin only)
router.post('/', authorizeStaff('admin'), branchController.createBranch);

// Update branch (admin only)
router.patch('/:id', authorizeStaff('admin'), branchController.updateBranch);

export default router;

