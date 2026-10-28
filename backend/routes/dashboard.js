import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/stats', authenticate, dashboardController.getStats);
router.get('/recent-orders', authenticate, dashboardController.getRecentOrders);
router.get('/low-stock', authenticate, dashboardController.getLowStockProducts);
router.get('/financial', authenticate, dashboardController.getFinancialStatus);

export default router;
