import express from 'express';
import { getReportData } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All report routes require user authentication
router.use(protect);

router.get('/', getReportData);

export default router;
