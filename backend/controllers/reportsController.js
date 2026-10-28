import pool from '../config/database.js';
import { NEAR_EXPIRY_DAYS } from '../utils/inventory.js';

const ACTIVE_SALE = "so.status NOT IN ('cancelled', 'returned')";
const RANGE_MONTHS = { '1month': 1, '3months': 3, '6months': 6, '1year': 12 };

// ماه‌های هجری شمسی با نام‌های افغانستان (حمل، ثور، ...)
const monthFormatter = new Intl.DateTimeFormat('fa-AF-u-ca-persian', { month: 'long' });
const monthKeyFormatter = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit' });
// کلید قابل مرتب‌سازی مثل 1405-08
const monthKeyOf = (date) => {
  const parts = Object.fromEntries(monthKeyFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}`;
};

const growthOf = (current, previous) => {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

// گزارش جامع برای صفحه گزارشات
export const getOverview = async (req, res) => {
  try {
    const months = RANGE_MONTHS[req.query.range] || 6;
    const rangeStart = `DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)`;
    const prevStart = `DATE_SUB(CURDATE(), INTERVAL ${months * 2} MONTH)`;

    // ---------- عملکرد ماهانه ----------
    // سود ناخالص = مبلغ فاکتور (بعد از تخفیف) منهای قیمت تمام‌شده اقلام
    const [dailySales] = await pool.query(`
      SELECT so.order_date as day, COUNT(*) as orders, SUM(so.total_amount) as sales,
        SUM(so.total_amount - COALESCE(cost.amount, 0)) as profit
      FROM sales_orders so
      LEFT JOIN (
        SELECT sales_order_id, SUM(quantity * cost_price) as amount
        FROM sales_order_items GROUP BY sales_order_id
      ) cost ON cost.sales_order_id = so.id
      WHERE so.order_date >= ${rangeStart} AND ${ACTIVE_SALE}
      GROUP BY so.order_date
    `);
    const [dailyPurchases] = await pool.query(`
      SELECT order_date as day, SUM(total_amount) as purchases
      FROM purchase_orders
      WHERE order_date >= ${rangeStart} AND status <> 'cancelled'
      GROUP BY order_date
    `);

    const monthlyMap = new Map();
    const bucket = (day) => {
      const date = new Date(day);
      const key = monthKeyOf(date);
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { key, month: monthFormatter.format(date), sales: 0, purchases: 0, profit: 0, orders: 0 });
      }
      return monthlyMap.get(key);
    };
    for (const row of dailySales) {
      const m = bucket(row.day);
      m.sales += Number(row.sales);
      m.profit += Number(row.profit);
      m.orders += Number(row.orders);
    }
    for (const row of dailyPurchases) {
      bucket(row.day).purchases += Number(row.purchases);
    }
    const monthly = [...monthlyMap.values()].sort((a, b) => a.key.localeCompare(b.key));

    // ---------- محصولات پرفروش ----------
    const [topProductRows] = await pool.query(`
      SELECT p.id, p.name, p.unit,
        SUM(CASE WHEN so.order_date >= ${rangeStart} THEN soi.quantity ELSE 0 END) as quantity,
        SUM(CASE WHEN so.order_date >= ${rangeStart} THEN soi.total_price ELSE 0 END) as revenue,
        SUM(CASE WHEN so.order_date < ${rangeStart} THEN soi.total_price ELSE 0 END) as previous_revenue
      FROM sales_order_items soi
      JOIN sales_orders so ON soi.sales_order_id = so.id
      JOIN products p ON soi.product_id = p.id
      WHERE so.order_date >= ${prevStart} AND ${ACTIVE_SALE}
      GROUP BY p.id
      HAVING revenue > 0
      ORDER BY revenue DESC
      LIMIT 5
    `);
    const [revenueTotal] = await pool.query(`
      SELECT COALESCE(SUM(soi.total_price), 0) as total
      FROM sales_order_items soi JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE so.order_date >= ${rangeStart} AND ${ACTIVE_SALE}
    `);
    const totalRevenue = Number(revenueTotal[0].total);
    const topProducts = topProductRows.map((row) => ({
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.unit,
      revenue: Number(row.revenue),
      percentage: totalRevenue > 0 ? Math.round((Number(row.revenue) / totalRevenue) * 100) : 0,
      growth: growthOf(Number(row.revenue), Number(row.previous_revenue))
    }));

    // ---------- برترین مشتریان (بدون مشتری متفرقه) ----------
    const [topCustomerRows] = await pool.query(`
      SELECT c.id, c.name,
        COUNT(DISTINCT CASE WHEN so.order_date >= ${rangeStart} THEN so.id END) as orders,
        SUM(CASE WHEN so.order_date >= ${rangeStart} THEN so.total_amount ELSE 0 END) as amount,
        SUM(CASE WHEN so.order_date < ${rangeStart} THEN so.total_amount ELSE 0 END) as previous_amount,
        MAX(so.order_date) as last_order_date
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      WHERE so.order_date >= ${prevStart} AND ${ACTIVE_SALE} AND c.credit_limit > 0
      GROUP BY c.id
      HAVING amount > 0
      ORDER BY amount DESC
      LIMIT 5
    `);
    const topCustomers = topCustomerRows.map((row) => ({
      name: row.name,
      orders: Number(row.orders),
      amount: Number(row.amount),
      growth: growthOf(Number(row.amount), Number(row.previous_amount)),
      last_order_date: row.last_order_date
    }));

    // ---------- وضعیت مالی ----------
    const [[receivables]] = await pool.query(`
      SELECT COALESCE(SUM(so.remaining_amount), 0) as amount, COUNT(DISTINCT so.customer_id) as count
      FROM sales_orders so WHERE so.remaining_amount > 0 AND ${ACTIVE_SALE}
    `);
    const [[payables]] = await pool.query(`
      SELECT COALESCE(SUM(remaining_amount), 0) as amount, COUNT(DISTINCT supplier_id) as count
      FROM purchase_orders WHERE remaining_amount > 0 AND status <> 'cancelled'
    `);
    const [[cash]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN reference_type = 'sales_order' THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN reference_type = 'purchase_order' THEN amount ELSE 0 END), 0) as amount
      FROM payments
    `);
    const [[inventory]] = await pool.query(`
      SELECT COALESCE(SUM(quantity * cost_price), 0) as value, COALESCE(SUM(quantity), 0) as quantity
      FROM product_batches
      WHERE quantity > 0 AND (expiry_date IS NULL OR expiry_date >= CURDATE())
    `);

    // ---------- هشدار موجودی با تخمین روزهای باقی‌مانده بر اساس فروش ۳۰ روز اخیر ----------
    const [stockRows] = await pool.query(`
      SELECT p.id, p.name, p.unit, p.stock_quantity, p.min_stock_quantity, p.purchase_price,
        (SELECT COALESCE(SUM(soi.quantity), 0) FROM sales_order_items soi
          JOIN sales_orders so ON soi.sales_order_id = so.id
          WHERE soi.product_id = p.id AND so.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND ${ACTIVE_SALE}) as sold_30_days
      FROM products p
      WHERE p.status = 'active'
      ORDER BY (p.stock_quantity / NULLIF(p.min_stock_quantity, 0)) ASC
    `);
    const stockStatus = (stock, minimum) =>
      stock <= minimum * 0.5 ? 'critical' : stock <= minimum ? 'low' : 'good';
    const inventoryItems = stockRows.map((row) => {
      const stock = Number(row.stock_quantity);
      const dailyUse = Number(row.sold_30_days) / 30;
      return {
        name: row.name,
        unit: row.unit,
        current: stock,
        minimum: Number(row.min_stock_quantity),
        value: stock * Number(row.purchase_price),
        status: stockStatus(stock, Number(row.min_stock_quantity)),
        days_left: dailyUse > 0 ? Math.floor(stock / dailyUse) : null
      };
    });
    const sumBy = (status) => inventoryItems.filter((i) => i.status === status).reduce((s, i) => s + i.current, 0);

    // ---------- کالای منقضی و نزدیک انقضا ----------
    const [expiring] = await pool.query(`
      SELECT b.batch_number, b.quantity, b.expiry_date, p.name as product_name, p.unit,
        IF(b.expiry_date < CURDATE(), 'expired', 'near_expiry') as status
      FROM product_batches b JOIN products p ON b.product_id = p.id
      WHERE b.quantity > 0 AND b.expiry_date IS NOT NULL
        AND b.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ${NEAR_EXPIRY_DAYS} DAY)
      ORDER BY b.expiry_date ASC
      LIMIT 10
    `);

    // ---------- خلاصه فروش ----------
    const [[salesSummary]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN so.order_date = CURDATE() THEN so.total_amount END), 0) as today,
        COALESCE(SUM(CASE WHEN so.order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN so.total_amount END), 0) as week,
        COALESCE(SUM(CASE WHEN so.order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN so.total_amount END), 0) as month
      FROM sales_orders so WHERE ${ACTIVE_SALE}
    `);

    // ---------- خلاصه مشتریان و تامین‌کنندگان ----------
    const [[customerSummary]] = await pool.query(`
      SELECT COUNT(*) as total,
        SUM(status = 'active') as active,
        SUM(created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as new_this_month,
        (SELECT COUNT(DISTINCT so.customer_id) FROM sales_orders so WHERE so.remaining_amount > 0 AND ${ACTIVE_SALE}) as debtors
      FROM customers
    `);
    const [[supplierSummary]] = await pool.query(`
      SELECT COUNT(*) as total, SUM(status = 'active') as active,
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders
          WHERE status <> 'cancelled' AND order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as purchases_this_month
      FROM suppliers
    `);

    // ---------- جزئیات مالی دوره ----------
    const [[salesTotals]] = await pool.query(`
      SELECT COALESCE(SUM(so.paid_amount), 0) as cash_sales, COALESCE(SUM(so.remaining_amount), 0) as credit_sales
      FROM sales_orders so WHERE so.order_date >= ${rangeStart} AND ${ACTIVE_SALE}
    `);
    const [[purchaseTotals]] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as purchases, COALESCE(SUM(shipping_cost + customs_cost), 0) as landing_costs
      FROM purchase_orders WHERE order_date >= ${rangeStart} AND status <> 'cancelled'
    `);
    // ارزش کالای معدوم‌شده (منقضی و ضایعات) به قیمت تمام‌شده بچ
    const [[writeOffs]] = await pool.query(`
      SELECT COALESCE(SUM(-it.quantity * b.cost_price), 0) as value
      FROM inventory_transactions it JOIN product_batches b ON it.batch_id = b.id
      WHERE it.transaction_type IN ('damage', 'expired') AND it.created_at >= ${rangeStart}
    `);
    const grossProfit = monthly.reduce((sum, m) => sum + m.profit, 0);

    res.json({
      success: true,
      data: {
        monthly,
        topProducts,
        topCustomers,
        financial: {
          receivables: { amount: Number(receivables.amount), count: Number(receivables.count) },
          payables: { amount: Number(payables.amount), count: Number(payables.count) },
          cash: Number(cash.amount),
          inventory: { value: Number(inventory.value), quantity: Number(inventory.quantity) }
        },
        inventory: {
          total: inventoryItems.reduce((s, i) => s + i.current, 0),
          good: sumBy('good'),
          low: sumBy('low'),
          critical: sumBy('critical'),
          items: inventoryItems
        },
        expiring,
        sales: {
          today: Number(salesSummary.today),
          week: Number(salesSummary.week),
          month: Number(salesSummary.month),
          daily_average: Math.round(Number(salesSummary.month) / 30)
        },
        customers: {
          total: Number(customerSummary.total),
          active: Number(customerSummary.active || 0),
          new_this_month: Number(customerSummary.new_this_month || 0),
          debtors: Number(customerSummary.debtors || 0)
        },
        suppliers: {
          total: Number(supplierSummary.total),
          active: Number(supplierSummary.active || 0),
          purchases_this_month: Number(supplierSummary.purchases_this_month),
          debt: Number(payables.amount)
        },
        details: {
          cash_sales: Number(salesTotals.cash_sales),
          credit_sales: Number(salesTotals.credit_sales),
          gross_profit: grossProfit,
          purchases: Number(purchaseTotals.purchases),
          landing_costs: Number(purchaseTotals.landing_costs),
          write_offs: Number(writeOffs.value),
          net_profit: grossProfit - Number(writeOffs.value)
        }
      }
    });
  } catch (error) {
    console.error('خطا در دریافت گزارش:', error);
    res.status(500).json({ success: false, message: 'خطا در دریافت گزارش' });
  }
};
