import pool from '../config/database.js';
import { AppError, newId, nextNumber, addBatch, logTransaction, syncProductStock, paymentStatusOf } from '../utils/inventory.js';

// دریافت تمام سفارشات خرید
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        po.*,
        s.name as supplier_name,
        s.phone as supplier_phone,
        COUNT(poi.id) as items_count
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      GROUP BY po.id
      ORDER BY po.created_at DESC
    `);

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('خطا در دریافت سفارشات خرید:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// دریافت جزئیات یک سفارش خرید
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(`
      SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.address as supplier_address
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
    }

    const [items] = await pool.query(`
      SELECT poi.*, p.name as product_name, p.sku, p.unit
      FROM purchase_order_items poi
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE poi.purchase_order_id = ?
    `, [id]);

    const [payments] = await pool.query(
      `SELECT * FROM payments WHERE reference_type = 'purchase_order' AND reference_id = ? ORDER BY payment_date, created_at`,
      [id]
    );

    res.json({ success: true, data: { ...orders[0], items, payments } });
  } catch (error) {
    console.error('خطا در دریافت جزئیات سفارش:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// ورود اقلام یک سفارش خرید به انبار: هر قلم یک بچ با تاریخ انقضا و قیمت تمام‌شده
const receiveItems = async (connection, orderId, userId) => {
  const [items] = await connection.query(
    `SELECT poi.*, p.name, p.track_expiry
     FROM purchase_order_items poi
     JOIN products p ON poi.product_id = p.id
     WHERE poi.purchase_order_id = ?`,
    [orderId]
  );

  for (const item of items) {
    if (item.track_expiry && !item.expiry_date) {
      throw new AppError(400, `تاریخ انقضای «${item.name}» وارد نشده است`);
    }
    await addBatch(connection, {
      product_id: item.product_id,
      batch_number: item.batch_number,
      expiry_date: item.track_expiry ? item.expiry_date : null,
      quantity: item.quantity,
      cost_price: item.landed_cost,
      purchase_order_id: orderId
    }, { user_id: userId, reference_type: 'purchase_order', reference_id: orderId });

    // قیمت خرید محصول = آخرین قیمت تمام‌شده
    await connection.query('UPDATE products SET purchase_price = ? WHERE id = ?', [item.landed_cost, item.product_id]);
  }
};

// ایجاد سفارش خرید جدید
export const createPurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      supplier_id, order_date, delivery_date, currency, exchange_rate,
      shipping_cost, customs_cost, paid_amount, payment_type, items, notes, status
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'حداقل یک قلم کالا لازم است');
    }

    const orderCurrency = currency || 'AFN';
    const rate = orderCurrency === 'AFN' ? 1 : Number(exchange_rate);
    if (!(rate > 0)) {
      throw new AppError(400, 'نرخ تبادله اسعار لازم است');
    }
    const extraCosts = (Number(shipping_cost) || 0) + (Number(customs_cost) || 0);

    // جمع اقلام به اسعار سفارش
    const subtotal = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unit_price), 0);
    if (!(subtotal > 0)) {
      throw new AppError(400, 'مقدار و قیمت اقلام نامعتبر است');
    }
    const today = new Date().toISOString().split('T')[0];
    for (const item of items) {
      if (!(Number(item.quantity) > 0) || !(Number(item.unit_price) >= 0)) {
        throw new AppError(400, 'مقدار و قیمت اقلام نامعتبر است');
      }
      if (item.expiry_date && item.expiry_date <= today) {
        throw new AppError(400, 'خرید کالای منقضی مجاز نیست');
      }
    }

    // مبلغ کل به افغانی
    const total_amount = Math.round((subtotal * rate + extraCosts) * 100) / 100;
    const paid = Number(paid_amount) || 0;
    if (paid < 0 || paid > total_amount) {
      throw new AppError(400, 'مبلغ پرداختی نامعتبر است');
    }
    const remaining_amount = total_amount - paid;
    const orderStatus = status || 'received';

    await connection.beginTransaction();

    const orderNumber = await nextNumber(connection, 'purchase_orders', 'PUR');
    const orderId = newId();

    await connection.query(
      `INSERT INTO purchase_orders
       (id, order_number, supplier_id, order_date, delivery_date, currency, exchange_rate, shipping_cost, customs_cost,
        total_amount, paid_amount, remaining_amount, payment_type, status, payment_status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, orderNumber, supplier_id, order_date, delivery_date || null, orderCurrency, rate,
        Number(shipping_cost) || 0, Number(customs_cost) || 0,
        total_amount, paid, remaining_amount, payment_type, orderStatus,
        paymentStatusOf(total_amount, paid), notes || null, req.user.id
      ]
    );

    // کرایه و گمرک به نسبت ارزش هر قلم سرشکن می‌شود
    for (const item of items) {
      const lineTotal = Number(item.quantity) * Number(item.unit_price);
      const landedCost = (lineTotal * rate + extraCosts * (lineTotal / subtotal)) / Number(item.quantity);
      await connection.query(
        `INSERT INTO purchase_order_items
         (id, purchase_order_id, product_id, quantity, unit_price, landed_cost, total_price, batch_number, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newId(), orderId, item.product_id, item.quantity, item.unit_price,
          Math.round(landedCost * 100) / 100, lineTotal, item.batch_number || null, item.expiry_date || null
        ]
      );
    }

    if (orderStatus === 'received') {
      await receiveItems(connection, orderId, req.user.id);
    }

    if (paid > 0) {
      await connection.query(
        'INSERT INTO payments (id, reference_type, reference_id, amount, payment_date, payment_method, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newId(), 'purchase_order', orderId, paid, order_date, payment_type, req.user.id]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'سفارش خرید با موفقیت ثبت شد', data: { id: orderId, order_number: orderNumber } });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در ایجاد سفارش خرید:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در ایجاد سفارش' });
  } finally {
    connection.release();
  }
};

// تغییر وضعیت: در انتظار، در راه (مثلاً در گمرک تورخم یا اسلام‌قلعه)، تحویل گرفته شد، لغو
export const updatePurchaseStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    if (!['pending', 'shipping', 'received', 'cancelled'].includes(status)) {
      throw new AppError(400, 'وضعیت نامعتبر است');
    }

    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (orders.length === 0) {
      throw new AppError(404, 'سفارش یافت نشد');
    }
    const order = orders[0];
    if (order.status === 'received' || order.status === 'cancelled') {
      throw new AppError(400, 'سفارش تحویل‌شده یا لغوشده قابل تغییر نیست');
    }

    if (status === 'received') {
      await receiveItems(connection, order.id, req.user.id);
    }
    await connection.query(
      'UPDATE purchase_orders SET status = ?, delivery_date = COALESCE(delivery_date, IF(? = "received", CURDATE(), NULL)) WHERE id = ?',
      [status, status, order.id]
    );

    await connection.commit();
    res.json({ success: true, message: status === 'received' ? 'کالا وارد انبار شد' : 'وضعیت سفارش بروزرسانی شد' });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در تغییر وضعیت خرید:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در بروزرسانی' });
  } finally {
    connection.release();
  }
};

// ثبت پرداخت به تامین‌کننده
export const addPurchasePayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const amount = Number(req.body.amount);
    const { payment_method, notes } = req.body;

    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM purchase_orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (orders.length === 0) {
      throw new AppError(404, 'سفارش یافت نشد');
    }
    const order = orders[0];
    if (!(amount > 0) || amount > Number(order.remaining_amount)) {
      throw new AppError(400, `مبلغ باید بین ۱ و ${Number(order.remaining_amount).toLocaleString()} افغانی باشد`);
    }

    const paid = Number(order.paid_amount) + amount;
    await connection.query(
      'UPDATE purchase_orders SET paid_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
      [paid, Number(order.remaining_amount) - amount, paymentStatusOf(Number(order.total_amount), paid), order.id]
    );
    await connection.query(
      'INSERT INTO payments (id, reference_type, reference_id, amount, payment_date, payment_method, notes, created_by) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)',
      [newId(), 'purchase_order', order.id, amount, payment_method || 'نقدی', notes || null, req.user.id]
    );

    await connection.commit();
    res.json({ success: true, message: 'پرداخت ثبت شد' });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در ثبت پرداخت:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در ثبت پرداخت' });
  } finally {
    connection.release();
  }
};

// حذف سفارش خرید؛ اگر کالای آن وارد انبار شده و از آن فروش رفته باشد حذف ممکن نیست
export const deletePurchaseOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();

    const [batches] = await connection.query(
      'SELECT * FROM product_batches WHERE purchase_order_id = ? FOR UPDATE',
      [id]
    );
    if (batches.some((b) => Number(b.quantity) !== Number(b.initial_quantity))) {
      throw new AppError(400, 'از کالای این سفارش فروش یا مصرف شده و قابل حذف نیست');
    }

    for (const batch of batches) {
      await logTransaction(connection, {
        product_id: batch.product_id,
        type: 'adjustment',
        quantity: -Number(batch.quantity),
        reference_type: 'purchase_order',
        reference_id: id,
        notes: 'حذف سفارش خرید',
        user_id: req.user.id
      });
      await connection.query('DELETE FROM product_batches WHERE id = ?', [batch.id]);
      await syncProductStock(connection, batch.product_id);
    }

    await connection.query(`DELETE FROM payments WHERE reference_type = 'purchase_order' AND reference_id = ?`, [id]);
    await connection.query('DELETE FROM purchase_orders WHERE id = ?', [id]);

    await connection.commit();
    res.json({ success: true, message: 'سفارش با موفقیت حذف شد' });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در حذف سفارش:', error);
    res.status(error.status || 500).json({ success: false, message: error instanceof AppError ? error.message : 'خطا در حذف سفارش' });
  } finally {
    connection.release();
  }
};
