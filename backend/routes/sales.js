import express from 'express';
import { 
  getSalesOrders, 
  getSalesOrder, 
  createSalesOrder, 
  updateSalesOrderStatus,
  addSalesPayment,
  getSalesStats 
} from '../controllers/salesController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getSalesOrders);
router.get('/stats', authenticate, getSalesStats);
router.get('/:id', authenticate, getSalesOrder);
router.post('/', authenticate, authorize('admin', 'manager', 'staff'), createSalesOrder);
router.post('/:id/payments', authenticate, authorize('admin', 'manager', 'staff'), addSalesPayment);
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), updateSalesOrderStatus);

export default router;
