import pool from '../config/database.js';
import { NEAR_EXPIRY_DAYS } from '../utils/inventory.js';

// دریافت آمار کلی
export const getStats = async (req, res) => {
  try {
    // فروش امروز
    const [todaySales] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales_orders
      WHERE DATE(order_date) = CURDATE() AND status NOT IN ('cancelled', 'returned')
    `);

    // موجودی انبار (دانه)
    const [totalStock] = await pool.query(`
      SELECT COALESCE(SUM(stock_quantity), 0) as total
      FROM products
    `);

    // تعداد سفارشات امروز
    const [todayOrders] = await pool.query(`
      SELECT COUNT(*) as total
      FROM sales_orders
      WHERE DATE(order_date) = CURDATE() AND status NOT IN ('cancelled', 'returned')
    `);

    // مشتریان فعال
    const [activeCustomers] = await pool.query(`
      SELECT COUNT(*) as total
      FROM customers
      WHERE status = 'active'
    `);

    // بچ‌های منقضی یا نزدیک انقضا
    const [expiringBatches] = await pool.query(`
      SELECT COUNT(*) as total
      FROM product_batches
      WHERE quantity > 0 AND expiry_date IS NOT NULL
        AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL ${NEAR_EXPIRY_DAYS} DAY)
    `);

    res.json({
      success: true,
      data: {
        todaySales: todaySales[0].total,
        totalStock: totalStock[0].total,
        todayOrders: todayOrders[0].total,
        activeCustomers: activeCustomers[0].total,
        expiringBatches: expiringBatches[0].total
      }
    });
  } catch (error) {
    console.error('خطا در دریافت آمار:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت آمار' });
  }
};

// دریافت سفارشات اخیر
export const getRecentOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT
        so.id,
        so.order_number,
        so.order_date,
        so.total_amount,
        so.status,
        so.sale_type,
        c.name as customer_name,
        GROUP_CONCAT(p.name SEPARATOR '، ') as products
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
      LEFT JOIN products p ON soi.product_id = p.id
      GROUP BY so.id
      ORDER BY so.created_at DESC
      LIMIT 10
    `);

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('خطا در دریافت سفارشات اخیر:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// دریافت محصولات با موجودی کم
export const getLowStockProducts = async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT
        id,
        name,
        stock_quantity,
        min_stock_quantity,
        unit,
        ROUND((stock_quantity / NULLIF(min_stock_quantity, 0)) * 100) as percentage
      FROM products
      WHERE stock_quantity <= min_stock_quantity AND status = 'active'
      ORDER BY percentage ASC
      LIMIT 10
    `);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('خطا در دریافت محصولات با موجودی کم:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};

// دریافت وضعیت مالی
export const getFinancialStatus = async (req, res) => {
  try {
    // طلب از مشتریان (قرض‌ها)
    const [receivables] = await pool.query(`
      SELECT COALESCE(SUM(remaining_amount), 0) as total
      FROM sales_orders
      WHERE remaining_amount > 0 AND status NOT IN ('cancelled', 'returned')
    `);

    // بدهی به تامین‌کنندگان
    const [payables] = await pool.query(`
      SELECT COALESCE(SUM(remaining_amount), 0) as total
      FROM purchase_orders
      WHERE remaining_amount > 0 AND status <> 'cancelled'
    `);

    const netAmount = receivables[0].total - payables[0].total;

    res.json({
      success: true,
      data: {
        receivables: receivables[0].total,
        payables: payables[0].total,
        netAmount: netAmount
      }
    });
  } catch (error) {
    console.error('خطا در دریافت وضعیت مالی:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت داده‌ها' });
  }
};
