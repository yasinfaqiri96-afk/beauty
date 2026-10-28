import pool from '../config/database.js';
import { newId } from '../utils/inventory.js';

// فقط فاکتورهای فعال در خرید و قرض مشتری حساب می‌شوند
const customerTotals = `
  COUNT(DISTINCT so.id) as total_orders,
  COALESCE(SUM(so.total_amount), 0) as total_amount,
  COALESCE(SUM(so.paid_amount), 0) as total_paid,
  COALESCE(SUM(so.remaining_amount), 0) as total_debt,
  MAX(so.order_date) as last_order_date
`;

// دریافت لیست مشتریان
export const getCustomers = async (req, res) => {
  try {
    const { search, status, customer_type } = req.query;
    let query = `
      SELECT c.*, ${customerTotals}
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customer_id AND so.status NOT IN ('cancelled', 'returned')
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.address LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    if (customer_type) {
      query += ' AND c.customer_type = ?';
      params.push(customer_type);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    const [customers] = await pool.query(query, params);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('خطا در دریافت مشتریان:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مشتریان'
    });
  }
};

// دریافت یک مشتری
export const getCustomer = async (req, res) => {
  try {
    const [customers] = await pool.query(
      `SELECT c.*, ${customerTotals}
      FROM customers c
      LEFT JOIN sales_orders so ON c.id = so.customer_id AND so.status NOT IN ('cancelled', 'returned')
      WHERE c.id = ?
      GROUP BY c.id`,
      [req.params.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'مشتری یافت نشد'
      });
    }

    // دریافت سفارشات مشتری
    const [orders] = await pool.query(
      'SELECT * FROM sales_orders WHERE customer_id = ? ORDER BY order_date DESC LIMIT 10',
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...customers[0],
        recent_orders: orders
      }
    });
  } catch (error) {
    console.error('خطا در دریافت مشتری:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مشتری'
    });
  }
};

// ایجاد مشتری جدید
export const createCustomer = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, customer_type, credit_limit } = req.body;

    // شماره تماس شناسه اصلی مشتری است
    const [existing] = await pool.query('SELECT id FROM customers WHERE phone = ?', [phone]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'مشتری با این شماره تماس قبلاً ثبت شده است'
      });
    }

    const id = newId();
    await pool.query(
      'INSERT INTO customers (id, name, contact_person, phone, email, address, customer_type, credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, contact_person || null, phone, email || null, address || null, customer_type || 'retail', Number(credit_limit) || 0]
    );

    res.status(201).json({
      success: true,
      message: 'مشتری با موفقیت ایجاد شد',
      data: { id }
    });
  } catch (error) {
    console.error('خطا در ایجاد مشتری:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد مشتری'
    });
  }
};

// بروزرسانی مشتری
export const updateCustomer = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, customer_type, credit_limit, status } = req.body;

    const [result] = await pool.query(
      'UPDATE customers SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, customer_type = ?, credit_limit = ?, status = ? WHERE id = ?',
      [name, contact_person || null, phone, email || null, address || null, customer_type || 'retail', Number(credit_limit) || 0, status || 'active', req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'مشتری یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'مشتری با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('خطا در بروزرسانی مشتری:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی مشتری'
    });
  }
};

// حذف مشتری
export const deleteCustomer = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'مشتری یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'مشتری با موفقیت حذف شد'
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: 'این مشتری فاکتور ثبت‌شده دارد؛ به جای حذف آن را غیرفعال کنید'
      });
    }
    console.error('خطا در حذف مشتری:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف مشتری'
    });
  }
};
