import pool from '../config/database.js';
import { newId } from '../utils/inventory.js';

// دریافت تمام تامین‌کنندگان
export const getAllSuppliers = async (req, res) => {
  try {
    const [suppliers] = await pool.query(`
      SELECT
        s.*,
        COUNT(DISTINCT po.id) as total_orders,
        COALESCE(SUM(po.total_amount), 0) as total_amount,
        COALESCE(SUM(po.remaining_amount), 0) as debt
      FROM suppliers s
      LEFT JOIN purchase_orders po ON s.id = po.supplier_id AND po.status <> 'cancelled'
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);

    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('خطا در دریافت تامین‌کنندگان:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// دریافت جزئیات یک تامین‌کننده
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);

    if (suppliers.length === 0) {
      return res.status(404).json({ success: false, message: 'تامین‌کننده یافت نشد' });
    }

    const [orders] = await pool.query(`
      SELECT * FROM purchase_orders
      WHERE supplier_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    res.json({ success: true, data: { ...suppliers[0], recent_orders: orders } });
  } catch (error) {
    console.error('خطا در دریافت جزئیات تامین‌کننده:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// ایجاد تامین‌کننده جدید
export const createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, country, currency, products, rating } = req.body;

    const id = newId();
    await pool.query(
      'INSERT INTO suppliers (id, name, contact_person, phone, email, address, country, currency, products, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, contact_person, phone, email || null, address || null, country || null, currency || 'AFN', products || null, rating || 5]
    );

    res.status(201).json({ success: true, message: 'تامین‌کننده با موفقیت ایجاد شد', data: { id } });
  } catch (error) {
    console.error('خطا در ایجاد تامین‌کننده:', error);
    res.status(500).json({ success: false, message: 'خطا در ایجاد تامین‌کننده' });
  }
};

// ویرایش تامین‌کننده
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact_person, phone, email, address, country, currency, products, rating, status } = req.body;

    await pool.query(
      'UPDATE suppliers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, country = ?, currency = ?, products = ?, rating = ?, status = ? WHERE id = ?',
      [name, contact_person, phone, email || null, address || null, country || null, currency || 'AFN', products || null, rating || 5, status || 'active', id]
    );

    res.json({ success: true, message: 'تامین‌کننده با موفقیت ویرایش شد' });
  } catch (error) {
    console.error('خطا در ویرایش تامین‌کننده:', error);
    res.status(500).json({ success: false, message: 'خطا در ویرایش تامین‌کننده' });
  }
};

// حذف تامین‌کننده
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM suppliers WHERE id = ?', [id]);
    res.json({ success: true, message: 'تامین‌کننده با موفقیت حذف شد' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, message: 'این تامین‌کننده سفارش خرید ثبت‌شده دارد و قابل حذف نیست' });
    }
    console.error('خطا در حذف تامین‌کننده:', error);
    res.status(500).json({ success: false, message: 'خطا در حذف تامین‌کننده' });
  }
};
