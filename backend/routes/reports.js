import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as reportsController from '../controllers/reportsController.js';

const router = express.Router();

// گزارش سود و مالی فقط برای مدیران
router.get('/overview', authenticate, authorize('admin', 'manager'), reportsController.getOverview);

export default router;
