import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// فقط مدیر سیستم کاربر جدید می‌سازد (قبلاً هر کسی می‌توانست خود را admin ثبت کند)
router.post('/register', authenticate, authorize('admin'), register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;
