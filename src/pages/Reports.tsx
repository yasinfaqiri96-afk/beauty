import { FileText, TrendingUp, Download, BarChart3, PieChart, DollarSign, Users, Package, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify } from '../lib/feedback';
import { formatDate } from '../lib/cosmetics';

const fmt = (value: number) => Math.round(Number(value) || 0).toLocaleString('fa-AF');
const growthLabel = (value: number) => `${value >= 0 ? '+' : '-'}${Math.abs(value).toLocaleString('fa-AF')}%`;

function Reports() {
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState('6months');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reports/overview', { params: { range: dateRange } });
      setReport(response.data.data);
    } catch (error: any) {
      console.error('خطا در دریافت گزارش:', error);
      notify.error(error.response?.data?.message || 'خطا در دریافت گزارش');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {loading && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>}
          <p className="mt-4 text-slate-600">{loading ? 'در حال بارگذاری...' : 'گزارش در دسترس نیست'}</p>
        </div>
      </div>
    );
  }

  const monthlyData = report.monthly;
  const maxProfit = Math.max(1, ...monthlyData.map((m: any) => m.profit));
  const profitPercent = (profit: number) => Math.max(0, Math.round((profit / maxProfit) * 100));

  const topProducts = report.topProducts.map((p: any) => ({
    name: p.name,
    sales: `${fmt(p.quantity)} ${p.unit}`,
    revenue: `${fmt(p.revenue)} افغانی`,
    percentage: p.percentage,
    growth: growthLabel(p.growth),
  }));

  const topCustomers = report.topCustomers.map((c: any) => ({
    name: c.name,
    orders: fmt(c.orders),
    amount: fmt(c.amount),
    growth: growthLabel(c.growth),
    lastOrder: formatDate(c.last_order_date),
  }));

  const financialData = [
    { title: 'طلب از مشتریان (قرض)', amount: fmt(report.financial.receivables.amount), type: 'receivable', count: `${fmt(report.financial.receivables.count)} مشتری` },
    { title: 'بدهی به تامینکنندگان', amount: fmt(report.financial.payables.amount), type: 'payable', count: `${fmt(report.financial.payables.count)} تامینکننده` },
    { title: 'موجودی نقد (دخل)', amount: fmt(report.financial.cash), type: 'cash', count: 'دریافت‌ها منهای پرداخت‌ها' },
    { title: 'ارزش کل موجودی', amount: fmt(report.financial.inventory.value), type: 'inventory', count: `${fmt(report.financial.inventory.quantity)} دانه` },
  ];

  const inventoryItems = report.inventory.items.map((item: any) => ({
    product: item.name,
    current: `${fmt(item.current)} ${item.unit}`,
    minimum: `${fmt(item.minimum)} ${item.unit}`,
    status: item.status,
    days: item.days_left === null ? 'فروش اخیر ندارد' : `${fmt(item.days_left)} روز`,
    value: item.value,
  }));
  const inventoryAlerts = inventoryItems.filter((item: any) => item.status !== 'good').slice(0, 6);

  const reportCategories = [
    { id: 'overview', label: 'کلی عملکرد', icon: BarChart3 },
    { id: 'financial', label: 'مالی', icon: DollarSign },
    { id: 'inventory', label: 'موجودی انبار', icon: Package },
    { id: 'sales', label: 'فروش', icon: TrendingUp },
    { id: 'customers', label: 'مشتریان', icon: Users },
    { id: 'suppliers', label: 'تامینکنندگان', icon: FileText },
  ];

  const expiredProducts = report.expiring.map((b: any) => ({
    product: b.batch_number ? `${b.product_name} لات ${b.batch_number}` : b.product_name,
    quantity: `${fmt(b.quantity)} ${b.unit}`,
    expiry: formatDate(b.expiry_date),
    status: b.status,
  }));

  const details = report.details;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="1month">۱ ماه گذشته</option>
            <option value="3months">۳ ماه گذشته</option>
            <option value="6months">۶ ماه گذشته</option>
            <option value="1year">۱ سال گذشته</option>
          </select>
          <button
            onClick={() => notify.info('دانلود گزارش Excel')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="md:inline hidden">دانلود</span>
            <span className="md:hidden inline">دانلود</span>
          </button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="flex flex-wrap gap-2">
        {reportCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedReport(category.id)}
              className={`flex items-center gap-2 md:px-4 px-3 md:py-2 py-2.5 rounded-lg transition-all duration-200 ${
                selectedReport === category.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-slate-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
            >
              <Icon className="md:w-4 md:h-4 w-5 h-5" />
              <span className="md:text-sm text-xs font-medium">{category.label}</span>
            </button>
          );
        })}
      </div>

      {/* Financial Overview - Only show on overview tab */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialData.map((item, index) => (
            <div key={index} className="glass-card rounded-2xl p-4 md:p-5 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  item.type === 'receivable' ? 'bg-emerald-100' :
                  item.type === 'payable' ? 'bg-red-100' :
                  item.type === 'cash' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  {item.type === 'receivable' ? <TrendingUp className="w-5 h-5 text-emerald-600" /> :
                   item.type === 'payable' ? <TrendingUp className="w-5 h-5 text-red-600 rotate-180" /> :
                   item.type === 'cash' ? <DollarSign className="w-5 h-5 text-blue-600" /> :
                   <Package className="w-5 h-5 text-amber-600" />}
                </div>
                <span className="text-xs text-slate-500">{item.count}</span>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">{item.title}</h3>
              <p data-sensitive className={`text-lg font-bold ${
                item.type === 'receivable' ? 'text-emerald-600' :
                item.type === 'payable' ? 'text-red-600' :
                item.type === 'cash' ? 'text-blue-600' : 'text-amber-600'
              }`}>{item.amount} افغانی</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly Performance - Only show on overview tab */}
      {selectedReport === 'overview' && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-amber-500" />
          گزارش عملکرد ماهانه
        </h3>
        {monthlyData.length === 0 && <p className="text-sm text-slate-500">در این دوره فروش یا خریدی ثبت نشده است.</p>}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">ماه</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">فروش</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">خرید</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">سود ناخالص</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">تعداد فاکتور</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">نمودار سود</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((data: any, index: number) => (
                <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{data.month}</td>
                  <td className="py-4 px-4 text-sm text-emerald-600 font-medium">{fmt(data.sales)} افغانی</td>
                  <td className="py-4 px-4 text-sm text-blue-600 font-medium">{fmt(data.purchases)} افغانی</td>
                  <td className="py-4 px-4 text-sm text-amber-600 font-bold">{fmt(data.profit)} افغانی</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{fmt(data.orders)} فاکتور</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${profitPercent(data.profit)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500">{profitPercent(data.profit)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {monthlyData.map((data: any, index: number) => (
            <div key={index} className="glass-card rounded-2xl p-4 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">{data.month}</div>
                  <div className="text-xs text-slate-600">{fmt(data.orders)} فاکتور</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-600">{fmt(data.sales)}</div>
                  <div className="text-xs text-slate-500">فروش</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>خرید: <span className="font-medium text-blue-600">{fmt(data.purchases)}</span></div>
                <div>سود: <span className="font-medium text-amber-600">{fmt(data.profit)}</span></div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${profitPercent(data.profit)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}

      {/* Inventory Alerts - Only show on overview tab */}
      {selectedReport === 'overview' && (
      <div className="glass-card rounded-2xl p-4 md:p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          هشدارهای موجودی و انقضاء
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-700 mb-4">موجودی کم</h4>
            <div className="space-y-3">
              {inventoryAlerts.length === 0 && <p className="text-sm text-slate-500">همه محصولات موجودی کافی دارند.</p>}
              {inventoryAlerts.map((item: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  item.status === 'critical' ? 'bg-red-50 border-red-500' :
                  item.status === 'low' ? 'bg-amber-50 border-amber-500' :
                  'bg-green-50 border-green-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.product}</p>
                      <p className="text-xs text-slate-600">موجود: {item.current} | حداقل: {item.minimum}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'critical' ? 'bg-red-100 text-red-700' :
                      item.status === 'low' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.status === 'critical' ? 'بحرانی' :
                       item.status === 'low' ? 'کم' : 'مناسب'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">تخمین تمام شدن: {item.days}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-700 mb-4">محصولات منقضی و نزدیک انقضاء</h4>
            <div className="space-y-3">
              {expiredProducts.length === 0 && <p className="text-sm text-slate-500">کالای نزدیک انقضا وجود ندارد.</p>}
              {expiredProducts.map((item: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border-l-4 ${
                  item.status === 'expired' ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.product}</p>
                      <p className="text-xs text-slate-600">مقدار: {item.quantity}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      item.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.status === 'expired' ? 'منقضی' : 'نزدیک انقضاء'}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">تاریخ انقضاء: {item.expiry}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Top Products and Customers - Only show on overview tab */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Products */}
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-500" />
            محصولات پرفروش
          </h3>
          <div className="space-y-4">
            {topProducts.map((product: any, index: number) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-800">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      product.growth.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>{product.growth}</span>
                    <span className="text-xs font-semibold text-amber-600">{product.percentage}٪</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                  <span>فروش: {product.sales}</span>
                  <span className="font-medium text-slate-800">{product.revenue}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-l from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${product.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            برترین مشتریان عمده
          </h3>
          <div className="space-y-4">
            {topCustomers.map((customer: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{customer.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>{customer.orders} فاکتور</span>
                      <span>•</span>
                      <span>آخرین خرید: {customer.lastOrder}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">{customer.amount}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-600">افغانی</span>
                    <span className={`text-xs font-medium px-1 py-0.5 rounded ${
                      customer.growth.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>{customer.growth}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {/* Sales Report */}
      {selectedReport === 'sales' && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
            گزارش تفصیلی فروش
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-700">فروش امروز</h4>
              <p className="text-2xl font-bold text-emerald-600">{fmt(report.sales.today)}</p>
              <p className="text-xs text-emerald-500">افغانی</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">فروش هفته</h4>
              <p className="text-2xl font-bold text-blue-600">{fmt(report.sales.week)}</p>
              <p className="text-xs text-blue-500">افغانی</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-amber-700">فروش ماه</h4>
              <p className="text-2xl font-bold text-amber-600">{fmt(report.sales.month)}</p>
              <p className="text-xs text-amber-500">افغانی</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-700">میانگین روزانه</h4>
              <p className="text-2xl font-bold text-purple-600">{fmt(report.sales.daily_average)}</p>
              <p className="text-xs text-purple-500">افغانی</p>
            </div>
          </div>
        </div>
      )}

      {/* Customers Report */}
      {selectedReport === 'customers' && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            گزارش تفصیلی مشتریان
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">کل مشتریان</h4>
              <p className="text-2xl font-bold text-blue-600">{fmt(report.customers.total)}</p>
              <p className="text-xs text-blue-500">مشتری</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">مشتریان فعال</h4>
              <p className="text-2xl font-bold text-green-600">{fmt(report.customers.active)}</p>
              <p className="text-xs text-green-500">مشتری</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-amber-700">مشتریان جدید</h4>
              <p className="text-2xl font-bold text-amber-600">{fmt(report.customers.new_this_month)}</p>
              <p className="text-xs text-amber-500">۳۰ روز اخیر</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">مشتریان قرضدار</h4>
              <p className="text-2xl font-bold text-red-600">{fmt(report.customers.debtors)}</p>
              <p className="text-xs text-red-500">مشتری</p>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Report */}
      {selectedReport === 'suppliers' && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            گزارش تفصیلی تامینکنندگان
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-700">کل تامینکنندگان</h4>
              <p className="text-2xl font-bold text-indigo-600">{fmt(report.suppliers.total)}</p>
              <p className="text-xs text-indigo-500">تامینکننده</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">تامینکنندگان فعال</h4>
              <p className="text-2xl font-bold text-green-600">{fmt(report.suppliers.active)}</p>
              <p className="text-xs text-green-500">تامینکننده</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-amber-700">کل خرید ماه</h4>
              <p className="text-2xl font-bold text-amber-600">{fmt(report.suppliers.purchases_this_month)}</p>
              <p className="text-xs text-amber-500">افغانی</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">بدهی به تامینکنندگان</h4>
              <p className="text-2xl font-bold text-red-600">{fmt(report.suppliers.debt)}</p>
              <p className="text-xs text-red-500">افغانی</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Financial Report */}
      {selectedReport === 'financial' && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" />
            گزارش تفصیلی مالی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">درآمدها</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">فروش نقدی</span>
                  <span data-sensitive className="font-medium text-green-600">{fmt(details.cash_sales)}</span>
                </div>
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">فروش قرض</span>
                  <span data-sensitive className="font-medium text-blue-600">{fmt(details.credit_sales)}</span>
                </div>
                <div className="flex justify-between p-2 bg-amber-50 rounded">
                  <span className="text-sm">سود ناخالص فروش</span>
                  <span data-sensitive className="font-medium text-amber-600">{fmt(details.gross_profit)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">هزینه‌ها</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm">خرید کالا</span>
                  <span data-sensitive className="font-medium text-red-600">{fmt(details.purchases)}</span>
                </div>
                <div className="flex justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">کرایه و محصول گمرکی</span>
                  <span data-sensitive className="font-medium text-orange-600">{fmt(details.landing_costs)}</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">ضایعات و کالای منقضی</span>
                  <span data-sensitive className="font-medium text-purple-600">{fmt(details.write_offs)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-700">سود خالص</h4>
              <div className={`p-4 bg-gradient-to-br rounded-lg text-white ${
                details.net_profit >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
              }`}>
                <p data-sensitive className="text-2xl font-bold">{fmt(details.net_profit)}</p>
                <p className="text-sm opacity-90">افغانی</p>
                <p className="text-xs mt-2 opacity-75">سود فروش منهای ضایعات (کرایه و گمرک در قیمت تمام‌شده حساب شده)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Management Report */}
      {selectedReport === 'inventory' && (
        <div className="glass-card rounded-2xl p-4 md:p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            گزارش مدیریت موجودی
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700">کل موجودی</h4>
              <p className="text-2xl font-bold text-blue-600">{fmt(report.inventory.total)}</p>
              <p className="text-xs text-blue-500">دانه</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700">موجودی مناسب</h4>
              <p className="text-2xl font-bold text-green-600">{fmt(report.inventory.good)}</p>
              <p className="text-xs text-green-500">دانه</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-amber-700">موجودی کم</h4>
              <p className="text-2xl font-bold text-amber-600">{fmt(report.inventory.low)}</p>
              <p className="text-xs text-amber-500">دانه</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">موجودی بحرانی</h4>
              <p className="text-2xl font-bold text-red-600">{fmt(report.inventory.critical)}</p>
              <p className="text-xs text-red-500">دانه</p>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                {inventoryItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-4 text-sm font-medium text-slate-800">{item.product}</td>
                    <td className="py-4 px-4 text-sm text-slate-700">{item.current}</td>
                    <td className="py-4 px-4 text-sm text-slate-700">{item.minimum}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.status === 'critical' ? 'bg-red-100 text-red-700' :
                        item.status === 'low' ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {item.status === 'critical' ? 'بحرانی' :
                         item.status === 'low' ? 'کم' : 'مناسب'}
                      </span>
                    </td>
                    <td data-sensitive className="py-4 px-4 text-sm font-medium text-slate-800">
                      {fmt(item.value)} افغانی
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
