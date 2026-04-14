import { Router } from 'express';
import { documentController } from '../controllers/documentController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all documents (independent of shipment)
router.get('/list', documentController.listAllDocuments);

// Search documents
router.get('/search', documentController.searchDocuments);

// Get shipment documents
router.get('/:shipmentId', documentController.getShipmentDocuments);

// Upload document (operations, admin)
router.post(
  '/:shipmentId',
  authorize('admin', 'operations'),
  upload.single('file'),
  documentController.uploadDocument
);

// Get document
router.get('/:id', documentController.getDocument);

// Delete document (admin only)
router.delete(
  '/:id',
  authorize('admin'),
  documentController.deleteDocument
);

// Download document
router.get('/:id/download', documentController.downloadDocument);

export default router;


