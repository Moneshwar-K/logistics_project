import { Router } from 'express';
import { podController } from '../controllers/podController';
import { authenticate, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all PODs
router.get('/', podController.listPODs);

// Create POD (operations, driver, admin)
router.post(
  '/',
  authorize('admin', 'operations', 'driver'),
  podController.createPOD
);

// Get POD
router.get('/:shipmentId', podController.getPOD);

// Upload POD files (operations, driver, admin)
router.post(
  '/upload/:shipmentId',
  authorize('admin', 'operations', 'driver'),
  upload.fields([
    { name: 'pod_file', maxCount: 1 },
    { name: 'signature_file', maxCount: 1 },
    { name: 'kyc_front', maxCount: 1 },
    { name: 'kyc_back', maxCount: 1 },
  ]),
  podController.uploadPODFiles
);

// Download POD (existing file)
router.get('/:shipmentId/download', podController.downloadPOD);

// Generate POD PDF (SRI CAARGO format)
router.get('/:shipmentId/pdf', async (req, res, next) => {
  try {
    const { pdfService } = await import('../services/pdfService');
    await pdfService.generatePODPDF(req.params.shipmentId, res);
  } catch (error) {
    next(error);
  }
});

export default router;

