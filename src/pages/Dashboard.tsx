import { Package, ShoppingCart, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import StatCards, { type StatCardItem } from '../components/StatCards';
import { SALES_STATUS, statusOf } from '../lib/cosmetics';

function Dashboard() {
  const [stats, setStats] = useState<any>({
    todaySales: 0,
    totalStock: 0,
    todayOrders: 0,
    activeCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [financial, setFinancial] = useState<any>({
    receivables: 0,
    payables: 0,
    netAmount: 0
  });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, lowStockRes, financialRes, customersRes, productsRes, salesRes, purchaseRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/recent-orders'),
        api.get('/dashboard/low-stock'),
        api.get('/dashboard/financial'),
        api.get('/customers'),
        api.get('/products'),
        api.get('/sales'),
        api.get('/purchase')
      ]);
      
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setLowStockProducts(lowStockRes.data.data);
      setFinancial(financialRes.data.data);
      setCustomers(customersRes.data.data);
      setProducts(productsRes.data.data);
      setSalesOrders(salesRes.data.data);
      setPurchaseOrders(purchaseRes.data.data);
    } catch (error) {
      console.error('خطا در دریافت داده‌های داشبورد:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const statsCards: StatCardItem[] = [
    { label: 'فروش امروز', value: Number(stats.todaySales).toLocaleString(), unit: 'افغانی', icon: DollarSign, tone: 'emerald' },
    { label: 'موجودی انبار', value: Number(stats.totalStock).toLocaleString(), unit: 'دانه', icon: Package, tone: 'blue' },
    { label: 'فاکتورهای امروز', value: stats.todayOrders, unit: 'فاکتور', icon: ShoppingCart, tone: 'amber' },
    { label: 'مشتریان فعال', value: stats.activeCustomers, unit: 'نفر', icon: Users, tone: 'purple' },
  ];

  // خلاصه‌های گزارش مشتریان، موجودی و مالی (همان طرح صفحه گزارشات، با داده واقعی)
  const sum = (rows: any[], pick: (row: any) => number) => rows.reduce((total, row) => total + (pick(row) || 0), 0);
  const formatQty = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const now = new Date();
  const customerSummary = {
    total: customers.length,
    active: customers.filter((c) => c.status === 'active').length,
    newThisMonth: customers.filter((c) => {
      const created = new Date(c.created_at);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }).length,
    debtors: customers.filter((c) => Number(c.total_debt) > 0).length,
  };

  // بحرانی: کمتر از نصف حداقل موجودی، کم: تا حداقل موجودی
  const stockStatus = (p: any) => {
    const stock = Number(p.stock_quantity);
    const minimum = Number(p.min_stock_quantity);
    if (stock <= minimum * 0.5) return 'critical';
    if (stock <= minimum) return 'low';
    return 'good';
  };
  const stockOf = (status: string) => sum(products.filter((p) => stockStatus(p) === status), (p) => Number(p.stock_quantity));
  const inventorySummary = {
    total: sum(products, (p) => Number(p.stock_quantity)),
    good: stockOf('good'),
    low: stockOf('low'),
    critical: stockOf('critical'),
  };

  // فاکتورهای لغو/مرجوع و خریدهای لغو شده حساب نمی‌شوند
  const activeSales = salesOrders.filter((o) => o.status !== 'cancelled' && o.status !== 'returned');
  const cashSales = sum(activeSales, (o) => Number(o.paid_amount));
  const creditSales = sum(activeSales, (o) => Number(o.remaining_amount));
  const purchasesTotal = sum(purchaseOrders.filter((o) => o.status !== 'cancelled'), (o) => Number(o.total_amount));
  const netBalance = cashSales + creditSales - purchasesTotal;

  return (
    <div className="space-y-6">
        <StatCards cards={statsCards} />

        <div className="grid-responsive-2 gap-responsive">
          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">₷</span>
              </div>
              <h3 className="text-subheading">وضعیت مالی</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">طلب از مشتریان</p>
                  <p data-sensitive className="text-lg font-bold text-emerald-800">{Number(financial.receivables).toLocaleString()} افغانی</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-red-700 font-medium">بدهی به تامینکنندگان</p>
                  <p data-sensitive className="text-lg font-bold text-red-800">{Number(financial.payables).toLocaleString()} افغانی</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700 font-medium">خالص مالی</p>
                  <p data-sensitive className="text-lg font-bold text-blue-800">{Number(financial.netAmount).toLocaleString()} افغانی</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card-elevated">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.8} />
              </span>
              <h3 className="text-subheading">هشدار موجودی کم</h3>
            </div>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 3).map((product: any, index: number) => (
                <div key={index} className="p-3 md:p-4 bg-white border border-[#E9ECF1] rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <span className="flex-shrink-0 text-xs text-slate-500">
                      <span className="font-bold text-red-500">{product.stock_quantity}</span>
                      <span className="mx-1 text-slate-300">/</span>
                      {product.min_stock_quantity} {product.unit}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="bg-red-400 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Number(product.percentage) || 0)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
              <h3 className="text-subheading">فاکتورهای اخیر</h3>
            </div>
          </div>
          
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">شماره سفارش</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">مشتری</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">محصولات</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">مبلغ</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-medium text-slate-800">{order.order_number}</td>
                    <td className="py-4 px-4 text-sm text-slate-700">{order.customer_name}</td>
                    <td className="py-4 px-4 text-sm text-slate-700">{order.products || 'محصولات مختلف'}</td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-800">{Number(order.total_amount).toLocaleString()} افغانی</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusOf(SALES_STATUS, order.status).className}`}>
                        {statusOf(SALES_STATUS, order.status).label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {recentOrders.map((order: any, index) => (
              <div key={index} className="glass-card rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-blue-600">{order.order_number}</div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${statusOf(SALES_STATUS, order.status).className}`}>
                      {statusOf(SALES_STATUS, order.status).label}
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-sm font-bold text-slate-800 mb-1">{order.customer_name}</div>
                    <div className="text-xs text-slate-600">{order.products || 'محصولات مختلف'}</div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-500">مبلغ</div>
                    <div className="text-sm font-bold text-emerald-600">{Number(order.total_amount).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customers Report */}
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            گزارش مشتریان
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">کل مشتریان</h4>
              <p className="text-2xl font-bold text-blue-600">{customerSummary.total.toLocaleString()}</p>
              <p className="text-xs text-blue-500">مشتری</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">مشتریان فعال</h4>
              <p className="text-2xl font-bold text-green-600">{customerSummary.active.toLocaleString()}</p>
              <p className="text-xs text-green-500">مشتری</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-amber-700">مشتریان جدید</h4>
              <p className="text-2xl font-bold text-amber-600">{customerSummary.newThisMonth.toLocaleString()}</p>
              <p className="text-xs text-amber-500">این ماه</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">مشتریان بدهکار</h4>
              <p className="text-2xl font-bold text-red-600">{customerSummary.debtors.toLocaleString()}</p>
              <p className="text-xs text-red-500">مشتری</p>
            </div>
          </div>
        </div>

        {/* Inventory Management Report */}
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            گزارش مدیریت موجودی
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">کل موجودی</h4>
              <p className="text-2xl font-bold text-blue-600">{formatQty(inventorySummary.total)}</p>
              <p className="text-xs text-blue-500">دانه</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">موجودی مناسب</h4>
              <p className="text-2xl font-bold text-green-600">{formatQty(inventorySummary.good)}</p>
              <p className="text-xs text-green-500">دانه</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-amber-700">موجودی کم</h4>
              <p className="text-2xl font-bold text-amber-600">{formatQty(inventorySummary.low)}</p>
              <p className="text-xs text-amber-500">دانه</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">موجودی بحرانی</h4>
              <p className="text-2xl font-bold text-red-600">{formatQty(inventorySummary.critical)}</p>
              <p className="text-xs text-red-500">دانه</p>
            </div>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">محصول</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">موجودی فعلی</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">حداقل موجودی</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">ارزش</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const status = stockStatus(item);
                  return (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-4 px-4 text-sm font-medium text-slate-800">{item.name}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{item.stock_quantity} {item.unit}</td>
                      <td className="py-4 px-4 text-sm text-slate-700">{item.min_stock_quantity} {item.unit}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status === 'critical' ? 'bg-red-100 text-red-700' :
                          status === 'low' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {status === 'critical' ? 'بحرانی' :
                           status === 'low' ? 'کم' : 'مناسب'}
                        </span>
                      </td>
                      <td data-sensitive className="py-4 px-4 text-sm font-medium text-slate-800">
                        {(Number(item.stock_quantity) * Number(item.purchase_price)).toLocaleString()} افغانی
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {products.map((item) => {
              const status = stockStatus(item);
              return (
                <div key={item.id} className="p-3 bg-white border border-[#E9ECF1] rounded-xl">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${
                          status === 'critical' ? 'bg-red-100 text-red-700' :
                          status === 'low' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                    }`}>
                      {status === 'critical' ? 'بحرانی' :
                       status === 'low' ? 'کم' : 'مناسب'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2 text-xs text-slate-500">
                    <span>موجودی: <span className="font-bold text-slate-800">{item.stock_quantity}</span> / {item.min_stock_quantity} {item.unit}</span>
                    <span data-sensitive className="font-medium text-slate-800 whitespace-nowrap">
                      {(Number(item.stock_quantity) * Number(item.purchase_price)).toLocaleString()} افغانی
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Financial Report */}
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" />
            گزارش مالی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">درآمدها</h4>
              <div className="space-y-2">
                <div className="flex justify-between gap-2 p-2 bg-green-50 rounded">
                  <span className="text-sm">فروش نقدی</span>
                  <span data-sensitive className="font-medium text-green-600">{cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2 p-2 bg-blue-50 rounded">
                  <span className="text-sm">فروش قرض</span>
                  <span data-sensitive className="font-medium text-blue-600">{creditSales.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">هزینه‌ها</h4>
              <div className="space-y-2">
                <div className="flex justify-between gap-2 p-2 bg-red-50 rounded">
                  <span className="text-sm">خرید کالا</span>
                  <span data-sensitive className="font-medium text-red-600">{purchasesTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">خالص فروش و خرید</h4>
              <div className={`p-4 bg-gradient-to-br rounded-lg text-white ${
                netBalance >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
              }`}>
                <p data-sensitive className="text-2xl font-bold">{netBalance.toLocaleString()}</p>
                <p className="text-sm opacity-90">افغانی</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default Dashboard;
