import express from 'express';
import RateSheet from '../models/RateSheet';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Get all rate sheets (with filtering)
router.get('/', authenticate, async (req, res) => {
    try {
        const { type, client_id, service_type } = req.query;
        const filter: any = {};
        if (type) filter.type = type;
        if (client_id) filter.client_id = client_id;
        if (service_type) filter.service_type = service_type;

        const rateSheets = await RateSheet.find(filter).populate('client_id', 'name');
        res.json({ data: rateSheets });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rate sheets', error });
    }
});

// Get single rate sheet
router.get('/:id', authenticate, async (req, res) => {
    try {
        const rateSheet = await RateSheet.findById(req.params.id);
        if (!rateSheet) {
            res.status(404).json({ message: 'Rate sheet not found' });
            return;
        }
        res.json({ data: rateSheet });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rate sheet', error });
    }
});

// Create rate sheet
router.post('/', authenticate, async (req, res) => {
    try {
        const rateSheet = new RateSheet(req.body);
        await rateSheet.save();
        res.status(201).json({ data: rateSheet });
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error creating rate sheet', error });
    }
});

// Update rate sheet
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const rateSheet = await RateSheet.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!rateSheet) {
            res.status(404).json({ message: 'Rate sheet not found' });
            return;
        }
        res.json({ data: rateSheet });
    } catch (error) {
        res.status(400).json({ message: 'Error updating rate sheet', error });
    }
});

// Delete rate sheet
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await RateSheet.findByIdAndDelete(req.params.id);
        res.json({ message: 'Rate sheet deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting rate sheet', error });
    }
});
// Upload rate sheet
import { upload } from '../middleware/upload';
import { rateSheetService } from '../services/rateSheetService';

router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const { name, type, client_id, service_type } = req.body;

        if (!service_type) {
            res.status(400).json({ message: 'Service type is required' });
            return;
        }

        const rateSheet = await rateSheetService.processRateSheet(req.file.path, {
            name: name || req.file.originalname,
            type: type || 'general',
            client_id: client_id || undefined,
            service_type: service_type
        });

        res.status(201).json({ success: true, data: rateSheet, message: 'Rate sheet uploaded and processed successfully' });

    } catch (error: any) {
        console.error('Rate upload error:', error);
        res.status(500).json({ message: error.message || 'Error processing rate sheet' });
    }
});

export default router;
