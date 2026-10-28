import pool from '../config/database.js';
import { AppError, addBatch, logTransaction, syncProductStock, NEAR_EXPIRY_DAYS } from '../utils/inventory.js';

// وضعیت هر بچ: انقضا مهم‌تر از کمبود موجودی است
const batchStatus = `
  CASE
    WHEN b.expiry_date IS NOT NULL AND b.expiry_date < CURDATE() THEN 'منقضی'
    WHEN b.expiry_date IS NOT NULL AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ${NEAR_EXPIRY_DAYS} DAY) THEN 'نزدیک انقضا'
    WHEN p.stock_quantity <= p.min_stock_quantity THEN 'کم'
    ELSE 'کافی'
  END
`;

// دریافت تمام موجودی انبار (به تفکیک بچ)
export const getAllStock = async (req, res) => {
  try {
    const [stock] = await pool.query(`
      SELECT
        b.*,
        p.name as product_name,
        p.sku,
        p.brand,
        p.category,
        p.unit,
        p.min_stock_quantity,
        DATEDIFF(b.expiry_date, CURDATE()) as days_to_expiry,
        ${batchStatus} as status
      FROM product_batches b
      LEFT JOIN products p ON b.product_id = p.id
      WHERE b.quantity > 0
      ORDER BY b.expiry_date IS NULL, b.expiry_date ASC
    `);

    res.json({ success: true, data: stock });
  } catch (error) {
    console.error('خطا در دریافت موجودی انبار:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// بچ‌های منقضی و نزدیک انقضا
export const getExpiring = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, p.name as product_name, p.sku, p.unit,
        DATEDIFF(b.expiry_date, CURDATE()) as days_to_expiry,
        IF(b.expiry_date < CURDATE(), 'expired', 'near_expiry') as status
      FROM product_batches b
      JOIN products p ON b.product_id = p.id
      WHERE b.quantity > 0 AND b.expiry_date IS NOT NULL
        AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ${NEAR_EXPIRY_DAYS} DAY)
      ORDER BY b.expiry_date ASC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('خطا در دریافت کالای نزدیک انقضا:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// افزودن موجودی دستی (موجودی اولیه یا کالای بدون سند خرید) به صورت یک بچ جدید
export const addStock = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { product_id, location, quantity, batch_number, expiry_date, cost_price } = req.body;

    const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      throw new AppError(404, 'محصول یافت نشد');
    }
    const product = products[0];
    if (product.track_expiry && !expiry_date) {
      throw new AppError(400, 'تاریخ انقضا برای این محصول لازم است');
    }
    if (expiry_date && expiry_date <= new Date().toISOString().split('T')[0]) {
      throw new AppError(400, 'ورود کالای منقضی به انبار مجاز نیست');
    }

    await connection.beginTransaction();
    const id = await addBatch(connection, {
      product_id,
      batch_number,
      expiry_date: product.track_expiry ? expiry_date : null,
      location,
      quantity,
      cost_price: cost_price || product.purchase_price
    }, { user_id: req.user.id, reference_type: 'manual', notes: 'ورود دستی موجودی' });
    await connection.commit();

    res.status(201).json({ success: true, message: 'موجودی با موفقیت اضافه شد', data: { id } });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در افزودن موجودی:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در افزودن موجودی' });
  } finally {
    connection.release();
  }
};

// ویرایش بچ (اصلاح شمارش انبار، قفسه، شماره لات یا تاریخ انقضا)
export const updateStock = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { quantity, location, batch_number, expiry_date, notes } = req.body;
    const newQuantity = Number(quantity);
    if (!(newQuantity >= 0)) {
      throw new AppError(400, 'مقدار نامعتبر است');
    }

    await connection.beginTransaction();

    const [batches] = await connection.query('SELECT * FROM product_batches WHERE id = ? FOR UPDATE', [id]);
    if (batches.length === 0) {
      throw new AppError(404, 'موجودی یافت نشد');
    }
    const batch = batches[0];
    const difference = newQuantity - Number(batch.quantity);

    await connection.query(
      `UPDATE product_batches SET quantity = ?, location = ?,
       batch_number = COALESCE(?, batch_number), expiry_date = COALESCE(?, expiry_date)
       WHERE id = ?`,
      [newQuantity, location || null, batch_number || null, expiry_date || null, id]
    );

    if (difference !== 0) {
      await logTransaction(connection, {
        product_id: batch.product_id,
        batch_id: id,
        type: 'adjustment',
        quantity: difference,
        reference_type: 'stock_count',
        notes: notes || 'اصلاح شمارش انبار',
        user_id: req.user.id
      });
    }
    await syncProductStock(connection, batch.product_id);

    await connection.commit();
    res.json({ success: true, message: 'موجودی با موفقیت ویرایش شد' });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در ویرایش موجودی:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در ویرایش موجودی' });
  } finally {
    connection.release();
  }
};

// حذف موجودی = معدوم کردن بچ (منقضی یا ضایعات)؛ سابقه بچ برای گزارش باقی می‌ماند
export const deleteStock = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [batches] = await connection.query('SELECT * FROM product_batches WHERE id = ? FOR UPDATE', [id]);
    if (batches.length === 0) {
      throw new AppError(404, 'موجودی یافت نشد');
    }
    const batch = batches[0];
    const isExpired = batch.expiry_date && new Date(batch.expiry_date) < new Date(new Date().toDateString());

    await connection.query('UPDATE product_batches SET quantity = 0 WHERE id = ?', [id]);
    await logTransaction(connection, {
      product_id: batch.product_id,
      batch_id: id,
      type: isExpired ? 'expired' : 'damage',
      quantity: -Number(batch.quantity),
      reference_type: 'write_off',
      notes: isExpired ? 'معدوم کردن کالای منقضی' : 'ضایعات / شکسته',
      user_id: req.user.id
    });
    await syncProductStock(connection, batch.product_id);

    await connection.commit();
    res.json({ success: true, message: isExpired ? 'کالای منقضی از موجودی خارج شد' : 'موجودی به عنوان ضایعات خارج شد' });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در حذف موجودی:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در حذف موجودی' });
  } finally {
    connection.release();
  }
};
