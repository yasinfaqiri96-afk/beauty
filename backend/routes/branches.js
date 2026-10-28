import express from 'express';
import { authenticate } from '../middleware/auth.js';
import * as branchesController from '../controllers/branchesController.js';

const router = express.Router();

router.get('/', authenticate, branchesController.getAllBranches);
router.get('/:id', authenticate, branchesController.getBranchById);
router.post('/', authenticate, branchesController.createBranch);
router.put('/:id', authenticate, branchesController.updateBranch);
router.delete('/:id', authenticate, branchesController.deleteBranch);

export default router;
