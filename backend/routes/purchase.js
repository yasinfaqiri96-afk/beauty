import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as purchaseController from '../controllers/purchaseController.js';

const router = express.Router();

router.get('/', authenticate, purchaseController.getAllPurchaseOrders);
router.get('/:id', authenticate, purchaseController.getPurchaseOrderById);
router.post('/', authenticate, authorize('admin', 'manager'), purchaseController.createPurchaseOrder);
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), purchaseController.updatePurchaseStatus);
router.post('/:id/payments', authenticate, authorize('admin', 'manager'), purchaseController.addPurchasePayment);
router.delete('/:id', authenticate, authorize('admin'), purchaseController.deletePurchaseOrder);

export default router;
