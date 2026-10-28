import pool from '../config/database.js';
import { AppError, newId, nextNumber, consumeFEFO, restoreSaleStock, paymentStatusOf } from '../utils/inventory.js';

// سفارش لغو شده یا مرجوعی در فروش و طلب حساب نمی‌شود
const ACTIVE_ORDER = "so.status NOT IN ('cancelled', 'returned')";

// دریافت لیست فروش
export const getSalesOrders = async (req, res) => {
  try {
    const { search, status, payment_status, sale_type, start_date, end_date } = req.query;
    let query = `
      SELECT so.*, c.name as customer_name, c.phone as customer_phone, c.customer_type
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (so.order_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      query += ' AND so.status = ?';
      params.push(status);
    }

    if (payment_status) {
      query += ' AND so.payment_status = ?';
      params.push(payment_status);
    }

    if (sale_type) {
      query += ' AND so.sale_type = ?';
      params.push(sale_type);
    }

    if (start_date) {
      query += ' AND so.order_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND so.order_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY so.order_date DESC, so.created_at DESC';

    const [orders] = await pool.query(query, params);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('خطا در دریافت سفارشات فروش:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارشات'
    });
  }
};

// دریافت یک سفارش فروش
export const getSalesOrder = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT so.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.customer_type
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE so.id = ?`,
      [req.params.id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد'
      });
    }

    // دریافت اقلام سفارش
    const [items] = await pool.query(
      `SELECT soi.*, p.name as product_name, p.sku, p.brand, p.unit
      FROM sales_order_items soi
      LEFT JOIN products p ON soi.product_id = p.id
      WHERE soi.sales_order_id = ?`,
      [req.params.id]
    );

    const [payments] = await pool.query(
      `SELECT * FROM payments WHERE reference_type = 'sales_order' AND reference_id = ? ORDER BY payment_date, created_at`,
      [req.params.id]
    );

    res.json({
      success: true,
      data: {
        ...orders[0],
        items,
        payments
      }
    });
  } catch (error) {
    console.error('خطا در دریافت سفارش:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش'
    });
  }
};

// ایجاد سفارش فروش جدید
export const createSalesOrder = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      customer_id, branch_id, order_date, delivery_date, sale_type,
      payment_type, paid_amount, discount_amount, items, notes, status
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'حداقل یک قلم کالا لازم است');
    }

    await connection.beginTransaction();

    const [customers] = await connection.query('SELECT * FROM customers WHERE id = ?', [customer_id]);
    if (customers.length === 0) {
      throw new AppError(404, 'مشتری یافت نشد');
    }
    const customer = customers[0];
    if (customer.status !== 'active') {
      throw new AppError(400, 'حساب این مشتری غیرفعال است');
    }

    // نوع فروش از نوع مشتری: دوکاندار عمده، بقیه پرچون
    const saleType = sale_type || (customer.customer_type === 'wholesale' ? 'wholesale' : 'retail');

    // قیمت هر قلم: اگر ارسال نشده باشد از لیست قیمت (پرچون یا عمده) برداشته می‌شود
    const lines = [];
    let subtotal = 0;
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!(quantity > 0)) {
        throw new AppError(400, 'مقدار هر قلم باید بیشتر از صفر باشد');
      }
      const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [item.product_id]);
      if (products.length === 0) {
        throw new AppError(404, 'محصول یافت نشد');
      }
      const product = products[0];
      if (product.status !== 'active') {
        throw new AppError(400, `محصول «${product.name}» غیرفعال است`);
      }

      const listPrice = saleType === 'wholesale' ? Number(product.wholesale_price || product.sale_price) : Number(product.sale_price);
      const unitPrice = item.unit_price !== undefined && item.unit_price !== '' ? Number(item.unit_price) : listPrice;

      // کارمند نمی‌تواند زیر قیمت خرید بفروشد
      if (req.user.role === 'staff' && unitPrice < Number(product.purchase_price)) {
        throw new AppError(403, `قیمت «${product.name}» کمتر از قیمت خرید است؛ تایید مدیر لازم است`);
      }

      lines.push({ product, quantity, unitPrice });
      subtotal += quantity * unitPrice;
    }

    const discount = Number(discount_amount) || 0;
    if (discount < 0 || discount > subtotal) {
      throw new AppError(400, 'مبلغ تخفیف نامعتبر است');
    }
    const total_amount = subtotal - discount;

    // پیش‌فرض: فروش نقدی کامل پرداخت شده، فروش قرض پرداختی ندارد
    const paid = paid_amount !== undefined && paid_amount !== ''
      ? Number(paid_amount)
      : (payment_type === 'قرض' ? 0 : total_amount);
    if (paid < 0 || paid > total_amount) {
      throw new AppError(400, 'مبلغ دریافتی نامعتبر است');
    }
    const remaining_amount = total_amount - paid;

    // کنترل قرض: مانده جدید + قرض قبلی نباید از سقف اعتبار مشتری بیشتر شود
    if (remaining_amount > 0) {
      const [debt] = await connection.query(
        `SELECT COALESCE(SUM(so.remaining_amount), 0) as total FROM sales_orders so WHERE so.customer_id = ? AND ${ACTIVE_ORDER}`,
        [customer_id]
      );
      const creditLimit = Number(customer.credit_limit);
      const newDebt = Number(debt[0].total) + remaining_amount;
      if (creditLimit <= 0) {
        throw new AppError(400, 'برای این مشتری فروش قرض مجاز نیست؛ سقف قرض تعریف نشده است');
      }
      if (newDebt > creditLimit && req.user.role !== 'admin') {
        throw new AppError(400, `قرض مشتری از سقف مجاز (${creditLimit.toLocaleString()} افغانی) بیشتر می‌شود`);
      }
    }

    const orderNumber = await nextNumber(connection, 'sales_orders', 'ORD');
    const orderId = newId();
    // سفارش آنلاین تا رسیدن به مشتری «در حال پردازش» می‌ماند، فروش دوکان همان لحظه تحویل است
    const orderStatus = status || (customer.customer_type === 'online' ? 'processing' : 'delivered');

    await connection.query(
      `INSERT INTO sales_orders
      (id, order_number, customer_id, branch_id, sale_type, order_date, delivery_date, subtotal, discount_amount,
       total_amount, paid_amount, remaining_amount, payment_type, status, payment_status, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, orderNumber, customer_id, branch_id || null, saleType,
        order_date || new Date().toISOString().split('T')[0], delivery_date || null,
        subtotal, discount, total_amount, paid, remaining_amount, payment_type || 'نقدی',
        orderStatus, paymentStatusOf(total_amount, paid), notes || null, req.user.id
      ]
    );

    // ایجاد اقلام سفارش و کسر موجودی از بچ‌ها (FEFO)
    for (const line of lines) {
      const costPrice = await consumeFEFO(connection, line.product.id, line.quantity, {
        user_id: req.user.id,
        reference_type: 'sales_order',
        reference_id: orderId
      });
      await connection.query(
        'INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price, cost_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newId(), orderId, line.product.id, line.quantity, line.unitPrice, costPrice, line.quantity * line.unitPrice]
      );
    }

    if (paid > 0) {
      await connection.query(
        'INSERT INTO payments (id, reference_type, reference_id, amount, payment_date, payment_method, created_by) VALUES (?, ?, ?, ?, CURDATE(), ?, ?)',
        [newId(), 'sales_order', orderId, paid, payment_type || 'نقدی', req.user.id]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'سفارش فروش با موفقیت ثبت شد',
      data: { id: orderId, order_number: orderNumber }
    });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در ایجاد سفارش فروش:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error instanceof AppError ? error.message : 'خطا در ایجاد سفارش'
    });
  } finally {
    connection.release();
  }
};

// بروزرسانی وضعیت سفارش؛ لغو و مرجوعی کالا را به بچ‌ها برمی‌گرداند
export const updateSalesOrderStatus = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status } = req.body;
    const allowed = ['pending', 'processing', 'delivered', 'cancelled', 'returned'];
    if (!allowed.includes(status)) {
      throw new AppError(400, 'وضعیت نامعتبر است');
    }

    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM sales_orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (orders.length === 0) {
      throw new AppError(404, 'سفارش یافت نشد');
    }
    const order = orders[0];
    const closed = ['cancelled', 'returned'];

    if (closed.includes(order.status)) {
      throw new AppError(400, 'سفارش لغو یا مرجوع شده قابل تغییر نیست');
    }

    if (closed.includes(status)) {
      await restoreSaleStock(connection, order.id, { user_id: req.user.id });
      // مانده طلب این سفارش بسته می‌شود؛ پول دریافت‌شده باید جداگانه به مشتری مسترد شود
      await connection.query('UPDATE sales_orders SET status = ?, remaining_amount = 0 WHERE id = ?', [status, order.id]);
    } else {
      await connection.query('UPDATE sales_orders SET status = ? WHERE id = ?', [status, order.id]);
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'وضعیت سفارش بروزرسانی شد'
    });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در بروزرسانی وضعیت:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error instanceof AppError ? error.message : 'خطا در بروزرسانی'
    });
  } finally {
    connection.release();
  }
};

// ثبت دریافت قرض از مشتری
export const addSalesPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const amount = Number(req.body.amount);
    const { payment_method, notes } = req.body;

    await connection.beginTransaction();

    const [orders] = await connection.query('SELECT * FROM sales_orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (orders.length === 0) {
      throw new AppError(404, 'سفارش یافت نشد');
    }
    const order = orders[0];
    if (['cancelled', 'returned'].includes(order.status)) {
      throw new AppError(400, 'برای سفارش لغو شده دریافت ثبت نمی‌شود');
    }
    if (!(amount > 0) || amount > Number(order.remaining_amount)) {
      throw new AppError(400, `مبلغ باید بین ۱ و ${Number(order.remaining_amount).toLocaleString()} افغانی باشد`);
    }

    const paid = Number(order.paid_amount) + amount;
    const remaining = Number(order.remaining_amount) - amount;
    await connection.query(
      'UPDATE sales_orders SET paid_amount = ?, remaining_amount = ?, payment_status = ? WHERE id = ?',
      [paid, remaining, paymentStatusOf(Number(order.total_amount), paid), order.id]
    );
    await connection.query(
      'INSERT INTO payments (id, reference_type, reference_id, amount, payment_date, payment_method, notes, created_by) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?)',
      [newId(), 'sales_order', order.id, amount, payment_method || 'نقدی', notes || null, req.user.id]
    );

    await connection.commit();
    res.json({ success: true, message: 'دریافت پول ثبت شد' });
  } catch (error) {
    await connection.rollback();
    console.error('خطا در ثبت دریافت:', error);
    res.status(error.status || 500).json({
      success: false,
      message: error instanceof AppError ? error.message : 'خطا در ثبت دریافت'
    });
  } finally {
    connection.release();
  }
};

// آمار فروش
export const getSalesStats = async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(remaining_amount), 0) as total_remaining
      FROM sales_orders so
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND ${ACTIVE_ORDER}
    `);

    const [todayStats] = await pool.query(`
      SELECT
        COUNT(*) as today_orders,
        COALESCE(SUM(total_amount), 0) as today_sales
      FROM sales_orders so
      WHERE order_date = CURDATE() AND ${ACTIVE_ORDER}
    `);

    res.json({
      success: true,
      data: {
        ...stats[0],
        ...todayStats[0]
      }
    });
  } catch (error) {
    console.error('خطا در دریافت آمار:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار'
    });
  }
};
