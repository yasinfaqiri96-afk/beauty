import pool from '../config/database.js';
import { AppError, newId, addBatch, NEAR_EXPIRY_DAYS } from '../utils/inventory.js';

// ستون‌های خلاصه بچ‌ها: نزدیک‌ترین تاریخ انقضا، مقدار منقضی و نزدیک انقضا
const batchSummary = `
  (SELECT MIN(b.expiry_date) FROM product_batches b
    WHERE b.product_id = p.id AND b.quantity > 0 AND b.expiry_date >= CURDATE()) as nearest_expiry,
  (SELECT COALESCE(SUM(b.quantity), 0) FROM product_batches b
    WHERE b.product_id = p.id AND b.quantity > 0 AND b.expiry_date < CURDATE()) as expired_quantity,
  (SELECT COALESCE(SUM(b.quantity), 0) FROM product_batches b
    WHERE b.product_id = p.id AND b.quantity > 0 AND b.expiry_date >= CURDATE()
      AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ${NEAR_EXPIRY_DAYS} DAY)) as near_expiry_quantity
`;

// دریافت لیست محصولات
export const getProducts = async (req, res) => {
  try {
    const { search, category, brand, status } = req.query;
    let query = `SELECT p.*, ${batchSummary} FROM products p WHERE 1=1`;
    const params = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode = ? OR p.brand LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, search, `%${search}%`);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (brand) {
      query += ' AND p.brand = ?';
      params.push(brand);
    }

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await pool.query(query, params);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('خطا در دریافت محصولات:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت محصولات'
    });
  }
};

// دریافت یک محصول با بچ‌های موجود
export const getProduct = async (req, res) => {
  try {
    const [products] = await pool.query(`SELECT p.*, ${batchSummary} FROM products p WHERE p.id = ?`, [req.params.id]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'محصول یافت نشد'
      });
    }

    const [batches] = await pool.query(
      'SELECT * FROM product_batches WHERE product_id = ? AND quantity > 0 ORDER BY expiry_date IS NULL, expiry_date ASC',
      [req.params.id]
    );

    res.json({
      success: true,
      data: { ...products[0], batches }
    });
  } catch (error) {
    console.error('خطا در دریافت محصول:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت محصول'
    });
  }
};

// ایجاد محصول جدید؛ موجودی اولیه به صورت یک بچ ثبت می‌شود
export const createProduct = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      sku, barcode, name, brand, category, origin,
      purchase_price, sale_price, wholesale_price,
      stock_quantity, min_stock_quantity, unit, track_expiry,
      batch_number, expiry_date, location
    } = req.body;

    if (Number(sale_price) < Number(purchase_price)) {
      return res.status(400).json({ success: false, message: 'قیمت فروش نباید کمتر از قیمت خرید باشد' });
    }

    // بررسی تکراری نبودن کد کالا و بارکد
    const [existing] = await connection.query(
      'SELECT id FROM products WHERE sku = ? OR (barcode IS NOT NULL AND barcode <> "" AND barcode = ?)',
      [sku, barcode || null]
    );
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'این کد کالا یا بارکد قبلاً ثبت شده است'
      });
    }

    const tracksExpiry = track_expiry === undefined ? 1 : (track_expiry ? 1 : 0);
    if (tracksExpiry && Number(stock_quantity) > 0 && !expiry_date) {
      return res.status(400).json({ success: false, message: 'برای موجودی اولیه تاریخ انقضا لازم است' });
    }

    await connection.beginTransaction();

    const id = newId();
    await connection.query(
      `INSERT INTO products
       (id, sku, barcode, name, brand, category, origin, purchase_price, sale_price, wholesale_price, stock_quantity, min_stock_quantity, unit, track_expiry)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        id, sku, barcode || null, name, brand || null, category, origin || null,
        purchase_price, sale_price, wholesale_price || sale_price,
        min_stock_quantity || 0, unit || 'دانه', tracksExpiry
      ]
    );

    if (Number(stock_quantity) > 0) {
      await addBatch(connection, {
        product_id: id,
        batch_number: batch_number || 'OPENING',
        expiry_date: tracksExpiry ? expiry_date : null,
        location,
        quantity: stock_quantity,
        cost_price: purchase_price
      }, { user_id: req.user.id, reference_type: 'opening_stock', notes: 'موجودی اولیه' });
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'محصول با موفقیت ایجاد شد',
      data: { id }
    });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در ایجاد محصول:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error instanceof AppError ? error.message : 'خطا در ایجاد محصول'
    });
  } finally {
    connection.release();
  }
};

// بروزرسانی محصول؛ موجودی فقط از راه خرید، فروش و انبار تغییر می‌کند
export const updateProduct = async (req, res) => {
  try {
    const {
      sku, barcode, name, brand, category, origin,
      purchase_price, sale_price, wholesale_price,
      min_stock_quantity, unit, track_expiry, status
    } = req.body;

    if (Number(sale_price) < Number(purchase_price)) {
      return res.status(400).json({ success: false, message: 'قیمت فروش نباید کمتر از قیمت خرید باشد' });
    }

    const [duplicate] = await pool.query(
      'SELECT id FROM products WHERE id <> ? AND (sku = ? OR (barcode IS NOT NULL AND barcode <> "" AND barcode = ?))',
      [req.params.id, sku, barcode || null]
    );
    if (duplicate.length > 0) {
      return res.status(400).json({ success: false, message: 'این کد کالا یا بارکد برای محصول دیگری ثبت شده است' });
    }

    const [result] = await pool.query(
      `UPDATE products SET
       sku = ?, barcode = ?, name = ?, brand = ?, category = ?, origin = ?,
       purchase_price = ?, sale_price = ?, wholesale_price = ?,
       min_stock_quantity = ?, unit = ?, track_expiry = ?, status = ?
       WHERE id = ?`,
      [
        sku, barcode || null, name, brand || null, category, origin || null,
        purchase_price, sale_price, wholesale_price || sale_price,
        min_stock_quantity || 0, unit || 'دانه', track_expiry === undefined ? 1 : (track_expiry ? 1 : 0),
        status || 'active', req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'محصول یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'محصول با موفقیت بروزرسانی شد'
    });
  } catch (error) {
    console.error('خطا در بروزرسانی محصول:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بروزرسانی محصول'
    });
  }
};

// حذف محصول؛ محصولی که سابقه خرید/فروش دارد فقط غیرفعال می‌شود
export const deleteProduct = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'محصول یافت نشد'
      });
    }

    res.json({
      success: true,
      message: 'محصول با موفقیت حذف شد'
    });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      await pool.query('UPDATE products SET status = "inactive" WHERE id = ?', [req.params.id]);
      return res.json({ success: true, message: 'محصول سابقه خرید یا فروش دارد؛ به جای حذف غیرفعال شد' });
    }
    console.error('خطا در حذف محصول:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف محصول'
    });
  }
};

// محصولات با موجودی کم
export const getLowStockProducts = async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM products WHERE stock_quantity <= min_stock_quantity AND status = "active" ORDER BY stock_quantity ASC'
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('خطا در دریافت محصولات با موجودی کم:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت محصولات'
    });
  }
};
