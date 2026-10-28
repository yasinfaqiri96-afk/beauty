import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as warehouseController from '../controllers/warehouseController.js';

const router = express.Router();

router.get('/stock', authenticate, warehouseController.getAllStock);
router.get('/expiring', authenticate, warehouseController.getExpiring);
router.post('/stock', authenticate, authorize('admin', 'manager'), warehouseController.addStock);
router.put('/stock/:id', authenticate, authorize('admin', 'manager'), warehouseController.updateStock);
router.delete('/stock/:id', authenticate, authorize('admin', 'manager'), warehouseController.deleteStock);

export default router;
