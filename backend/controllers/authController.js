import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import { newId } from '../utils/inventory.js';

// ثبت نام
export const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, role = 'staff' } = req.body;

    // بررسی وجود کاربر
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'این ایمیل قبلاً ثبت شده است' 
      });
    }

    // هش کردن رمز عبور
    const password_hash = await bcrypt.hash(password, 10);

    // ایجاد کاربر جدید
    const id = newId();
    await pool.query(
      'INSERT INTO users (id, email, password_hash, full_name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, password_hash, full_name, phone, role]
    );

    res.status(201).json({
      success: true,
      message: 'کاربر با موفقیت ثبت شد',
      data: { id }
    });
  } catch (error) {
    console.error('خطا در ثبت نام:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در ثبت نام' 
    });
  }
};

// ورود
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // یافتن کاربر
    const [users] = await pool.query(
      'SELECT id, email, password_hash, full_name, phone, role, status FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'ایمیل یا رمز عبور اشتباه است' 
      });
    }

    const user = users[0];

    // بررسی وضعیت کاربر
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'حساب کاربری شما غیرفعال است' 
      });
    }

    // بررسی رمز عبور
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'ایمیل یا رمز عبور اشتباه است' 
      });
    }

    // ایجاد توکن
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // حذف رمز عبور از پاسخ
    delete user.password_hash;

    res.json({ 
      success: true, 
      message: 'ورود موفقیت‌آمیز',
      data: { 
        token, 
        user 
      }
    });
  } catch (error) {
    console.error('خطا در ورود:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در ورود' 
    });
  }
};

// دریافت اطلاعات کاربر فعلی
export const getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, full_name, phone, role, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'کاربر یافت نشد' 
      });
    }

    res.json({ 
      success: true, 
      data: users[0] 
    });
  } catch (error) {
    console.error('خطا در دریافت اطلاعات کاربر:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت اطلاعات' 
    });
  }
};
