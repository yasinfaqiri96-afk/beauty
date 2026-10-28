import pool from '../config/database.js';
import { newId } from '../utils/inventory.js';

// دریافت تمام شعبات
export const getAllBranches = async (req, res) => {
  try {
    const [branches] = await pool.query(`
      SELECT 
        b.*,
        COUNT(DISTINCT u.id) as employees_count
      FROM branches b
      LEFT JOIN users u ON b.id = u.branch_id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    
    res.json({ success: true, data: branches });
  } catch (error) {
    console.error('خطا در دریافت شعبات:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// دریافت جزئیات یک شعبه
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [branches] = await pool.query('SELECT * FROM branches WHERE id = ?', [id]);
    
    if (branches.length === 0) {
      return res.status(404).json({ success: false, message: 'شعبه یافت نشد' });
    }
    
    const [employees] = await pool.query(
      'SELECT id, email, full_name, phone, role FROM users WHERE branch_id = ?',
      [id]
    );
    
    res.json({ success: true, data: { ...branches[0], employees } });
  } catch (error) {
    console.error('خطا در دریافت جزئیات شعبه:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// ایجاد شعبه جدید
export const createBranch = async (req, res) => {
  try {
    const { code, name, address, phone, manager_name } = req.body;
    
    const id = newId();
    await pool.query(
      'INSERT INTO branches (id, code, name, address, phone, manager_name) VALUES (?, ?, ?, ?, ?, ?)',
      [id, code, name, address, phone, manager_name]
    );

    res.status(201).json({ success: true, message: 'شعبه با موفقیت ایجاد شد', data: { id } });
  } catch (error) {
    console.error('خطا در ایجاد شعبه:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد شعبه' });
  }
};

// ویرایش شعبه
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, address, phone, manager_name, status } = req.body;
    
    await pool.query(
      'UPDATE branches SET code = ?, name = ?, address = ?, phone = ?, manager_name = ?, status = ? WHERE id = ?',
      [code, name, address, phone, manager_name, status, id]
    );
    
    res.json({ success: true, message: 'شعبه با موفقیت ویرایش شد' });
  } catch (error) {
    console.error('خطا در ویرایش شعبه:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش شعبه' });
  }
};

// حذف شعبه
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if branch has employees
    const [employees] = await pool.query('SELECT COUNT(*) as count FROM users WHERE branch_id = ?', [id]);
    if (employees[0].count > 0) {
      return res.status(400).json({ success: false, message: 'این شعبه دارای کارمند است و نمی‌توان آن را حذف کرد' });
    }
    
    await pool.query('DELETE FROM branches WHERE id = ?', [id]);
    res.json({ success: true, message: 'شعبه با موفقیت حذف شد' });
  } catch (error) {
    console.error('خطا در حذف شعبه:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف شعبه' });
  }
};
