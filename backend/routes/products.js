import express from 'express';
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getLowStockProducts 
} from '../controllers/productsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getProducts);
router.get('/low-stock', authenticate, getLowStockProducts);
router.get('/:id', authenticate, getProduct);
router.post('/', authenticate, authorize('admin', 'manager'), createProduct);
router.put('/:id', authenticate, authorize('admin', 'manager'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);

export default router;
