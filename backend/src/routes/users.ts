import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

// All routes require Staff authentication
router.use(authenticateStaff);

// List users (admin only)
router.get('/', authorizeStaff('admin'), userController.listUsers);

// Create user (admin only)
router.post('/', authorizeStaff('admin'), userController.createUser);

// Get user
router.get('/:id', userController.getUser);

// Update user (admin only)
router.patch('/:id', authorizeStaff('admin'), userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authorizeStaff('admin'), userController.deleteUser);

// Get users by role
router.get('/role/:role', authorizeStaff('admin'), userController.getUsersByRole);

export default router;

