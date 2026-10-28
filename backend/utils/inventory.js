import { randomUUID } from 'crypto';

// کالایی که کمتر از این تعداد روز به انقضا دارد «نزدیک انقضا» حساب می‌شود
export const NEAR_EXPIRY_DAYS = 90;

// خطای قابل نمایش به کاربر با کد HTTP
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// کلیدها UUID هستند و insertId در MySQL برای آن‌ها صفر برمی‌گردد، پس شناسه در Node ساخته می‌شود
export const newId = () => randomUUID();

// شماره بعدی سند مثل ORD-001 یا PUR-001
export const nextNumber = async (connection, table, prefix) => {
  const [rows] = await connection.query(
    `SELECT order_number FROM ${table}
     WHERE order_number LIKE ?
     ORDER BY CAST(SUBSTRING(order_number, ?) AS UNSIGNED) DESC
     LIMIT 1`,
    [`${prefix}-%`, prefix.length + 2]
  );
  const lastNum = rows.length > 0 ? parseInt(rows[0].order_number.split('-')[1]) || 0 : 0;
  return `${prefix}-${String(lastNum + 1).padStart(3, '0')}`;
};

// موجودی محصول همیشه برابر جمع بچ‌ها است
export const syncProductStock = async (connection, productId) => {
  await connection.query(
    `UPDATE products
     SET stock_quantity = (SELECT COALESCE(SUM(quantity), 0) FROM product_batches WHERE product_id = ?)
     WHERE id = ?`,
    [productId, productId]
  );
};

// ثبت تراکنش موجودی
export const logTransaction = async (connection, { product_id, batch_id, type, quantity, reference_type, reference_id, notes, user_id }) => {
  await connection.query(
    `INSERT INTO inventory_transactions
     (id, product_id, batch_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [newId(), product_id, batch_id || null, type, quantity, reference_type || null, reference_id || null, notes || null, user_id || null]
  );
};

// ورود کالا به یک بچ جدید (خرید، موجودی اولیه یا ورود دستی)
export const addBatch = async (connection, batch, { user_id, reference_type, reference_id, notes } = {}) => {
  const quantity = Number(batch.quantity);
  if (!(quantity > 0)) {
    throw new AppError(400, 'مقدار باید بیشتر از صفر باشد');
  }

  const id = newId();
  await connection.query(
    `INSERT INTO product_batches
     (id, product_id, batch_number, expiry_date, location, quantity, initial_quantity, cost_price, purchase_order_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      batch.product_id,
      batch.batch_number || null,
      batch.expiry_date || null,
      batch.location || null,
      quantity,
      quantity,
      Number(batch.cost_price) || 0,
      batch.purchase_order_id || null
    ]
  );

  await logTransaction(connection, {
    product_id: batch.product_id,
    batch_id: id,
    type: 'in',
    quantity,
    reference_type,
    reference_id,
    notes,
    user_id
  });
  await syncProductStock(connection, batch.product_id);
  return id;
};

// خروج کالا به روش FEFO: اول بچی که زودتر منقضی می‌شود؛ بچ منقضی فروخته نمی‌شود
// خروجی: قیمت تمام‌شده میانگین مقدار خارج‌شده
export const consumeFEFO = async (connection, productId, quantity, { user_id, reference_type, reference_id } = {}) => {
  const [products] = await connection.query('SELECT name FROM products WHERE id = ?', [productId]);
  if (products.length === 0) {
    throw new AppError(404, 'محصول یافت نشد');
  }

  const [batches] = await connection.query(
    `SELECT id, quantity, cost_price
     FROM product_batches
     WHERE product_id = ? AND quantity > 0 AND (expiry_date IS NULL OR expiry_date >= CURDATE())
     ORDER BY expiry_date IS NULL, expiry_date ASC, received_at ASC
     FOR UPDATE`,
    [productId]
  );

  const available = batches.reduce((sum, b) => sum + Number(b.quantity), 0);
  if (available < quantity) {
    throw new AppError(400, `موجودی قابل فروش «${products[0].name}» کافی نیست (موجود: ${available})`);
  }

  let remaining = quantity;
  let totalCost = 0;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, Number(batch.quantity));
    await connection.query('UPDATE product_batches SET quantity = quantity - ? WHERE id = ?', [take, batch.id]);
    await logTransaction(connection, {
      product_id: productId,
      batch_id: batch.id,
      type: 'out',
      quantity: take,
      reference_type,
      reference_id,
      user_id
    });
    totalCost += take * Number(batch.cost_price);
    remaining -= take;
  }

  await syncProductStock(connection, productId);
  return quantity > 0 ? totalCost / quantity : 0;
};

// برگشت کالای یک سند فروش به همان بچ‌هایی که از آن‌ها خارج شده بود (لغو یا مرجوعی)
export const restoreSaleStock = async (connection, salesOrderId, { user_id, type = 'return' } = {}) => {
  const [rows] = await connection.query(
    `SELECT product_id, batch_id, SUM(quantity) as quantity
     FROM inventory_transactions
     WHERE reference_type = 'sales_order' AND reference_id = ? AND transaction_type = 'out'
     GROUP BY product_id, batch_id`,
    [salesOrderId]
  );

  const productIds = new Set();
  for (const row of rows) {
    let batchId = row.batch_id;
    if (batchId) {
      const [result] = await connection.query('UPDATE product_batches SET quantity = quantity + ? WHERE id = ?', [row.quantity, batchId]);
      if (result.affectedRows === 0) batchId = null;
    }
    if (!batchId) {
      // بچ اصلی حذف شده؛ کالا در بچ جدید بدون تاریخ برمی‌گردد
      batchId = newId();
      await connection.query(
        'INSERT INTO product_batches (id, product_id, batch_number, quantity, initial_quantity) VALUES (?, ?, ?, ?, ?)',
        [batchId, row.product_id, 'RETURN', row.quantity, row.quantity]
      );
    }
    await logTransaction(connection, {
      product_id: row.product_id,
      batch_id: batchId,
      type,
      quantity: row.quantity,
      reference_type: 'sales_order',
      reference_id: salesOrderId,
      user_id
    });
    productIds.add(row.product_id);
  }

  for (const productId of productIds) {
    await syncProductStock(connection, productId);
  }
};

// وضعیت پرداخت از روی مبلغ کل و پرداخت‌شده
export const paymentStatusOf = (total, paid) =>
  paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
