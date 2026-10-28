import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as suppliersController from '../controllers/suppliersController.js';

const router = express.Router();

router.get('/', authenticate, suppliersController.getAllSuppliers);
router.get('/:id', authenticate, suppliersController.getSupplierById);
router.post('/', authenticate, suppliersController.createSupplier);
router.put('/:id', authenticate, suppliersController.updateSupplier);
router.delete('/:id', authenticate, suppliersController.deleteSupplier);

export default router;
