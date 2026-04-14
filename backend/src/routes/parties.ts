import { Router } from 'express';
import { partyController } from '../controllers/partyController';
import { authenticateStaff, authorizeStaff } from '../middleware/staffAuth';

const router = Router();

router.use(authenticateStaff);

// List clients/parties
router.get('/', partyController.listParties);

// Get single party
router.get('/:id', partyController.getParty);

// Create party (admin only)
router.post('/', authorizeStaff('admin'), partyController.createParty);

// Update party (admin only)
router.patch('/:id', authorizeStaff('admin'), partyController.updateParty);

// Delete (soft) party (admin only)
router.delete('/:id', authorizeStaff('admin'), partyController.deleteParty);

export default router;
