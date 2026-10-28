import express from 'express';
import { 
  getCustomers, 
  getCustomer, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../controllers/customersController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getCustomers);
router.get('/:id', authenticate, getCustomer);
router.post('/', authenticate, authorize('admin', 'manager'), createCustomer);
router.put('/:id', authenticate, authorize('admin', 'manager'), updateCustomer);
router.delete('/:id', authenticate, authorize('admin'), deleteCustomer);

export default router;
