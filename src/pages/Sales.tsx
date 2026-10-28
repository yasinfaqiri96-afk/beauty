import { ShoppingCart, Plus, Search, Filter, Eye, X, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import { useAuth } from '../context/AuthContext';
import { SALES_STATUS, SALE_PAYMENT_TYPES, statusOf, formatDate, today } from '../lib/cosmetics';
import Modal from '../components/Modal';
import StatCards from '../components/StatCards';

const emptyItem = { product_id: '', quantity: '', unit_price: '' };

const emptyForm = () => ({
  customer_id: '',
  sale_type: 'retail',
  order_date: today(),
  payment_type: 'نقدی',
  paid_amount: '',
  discount_amount: '',
  notes: '',
  items: [{ ...emptyItem }]
});

function Sales() {
  const { user } = useAuth();
  const canManage = user?.role === 'admin' || user?.role === 'manager';
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formData, setFormData] = useState<any>(emptyForm());
  const [payment, setPayment] = useState({ amount: '', payment_method: 'نقدی' });

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes, productsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/customers', { params: { status: 'active' } }),
        api.get('/products', { params: { status: 'active' } })
      ]);
      setSalesOrders(salesRes.data.data);
      setCustomers(customersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('خطا در دریافت فروش‌ها:', error);
      notify.error('خطا در دریافت فروش‌ها');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await api.get(`/sales/${orderId}`);
      setSelectedOrder(response.data.data);
      setPayment({ amount: '', payment_method: 'نقدی' });
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('خطا در دریافت جزئیات:', error);
      notify.error('خطا در دریافت جزئیات');
    }
  };

  // فاکتور جدید با مشتری متفرقه (پرچون) شروع می‌شود
  const openAddModal = () => {
    const walkIn = customers.find((c) => c.customer_type === 'retail' && Number(c.credit_limit) === 0);
    setFormData({ ...emptyForm(), customer_id: walkIn?.id || '' });
    setShowAddModal(true);
  };

  const priceFor = (productId: string, saleType: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return '';
    return String(saleType === 'wholesale' ? Number(product.wholesale_price || product.sale_price) : Number(product.sale_price));
  };

  const changeCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    const saleType = customer?.customer_type === 'wholesale' ? 'wholesale' : 'retail';
    setFormData({
      ...formData,
      customer_id: customerId,
      sale_type: saleType,
      items: formData.items.map((item: any) => ({ ...item, unit_price: priceFor(item.product_id, saleType) }))
    });
  };

  const changeSaleType = (saleType: string) => {
    setFormData({
      ...formData,
      sale_type: saleType,
      items: formData.items.map((item: any) => ({ ...item, unit_price: priceFor(item.product_id, saleType) }))
    });
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });
  };

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_: any, i: number) => i !== index) });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'product_id') {
      newItems[index].unit_price = priceFor(value, formData.sale_type);
    }
    setFormData({ ...formData, items: newItems });
  };

  const subtotal = formData.items.reduce((sum: number, item: any) => sum + Number(item.quantity) * Number(item.unit_price), 0);
  const total = subtotal - (Number(formData.discount_amount) || 0);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sales', {
        ...formData,
        items: formData.items.map((item: any) => ({
          product_id: item.product_id,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price)
        }))
      });
      notify.success('فاکتور فروش با موفقیت ثبت شد');
      setShowAddModal(false);
      fetchSales();
    } catch (error: any) {
      console.error('خطا در ثبت فروش:', error);
      notify.error(error.response?.data?.message || 'خطا در ثبت فروش');
    }
  };

  const handleReceivePayment = async () => {
    try {
      await api.post(`/sales/${selectedOrder.id}/payments`, { ...payment, amount: Number(payment.amount) });
      notify.success('دریافت پول ثبت شد');
      await viewOrderDetails(selectedOrder.id);
      fetchSales();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'خطا در ثبت دریافت');
    }
  };

  const handleChangeStatus = async (status: string) => {
    const closing = status === 'cancelled' || status === 'returned';
    if (closing && !(await confirmDialog({
      title: status === 'cancelled' ? 'لغو فاکتور' : 'مرجوعی فاکتور',
      message: 'کالاهای این فاکتور به انبار برمی‌گردد و مانده قرض آن بسته می‌شود. پول دریافت‌شده را جداگانه به مشتری مسترد کنید.',
      confirmText: 'تایید',
      danger: true
    }))) return;
    try {
      await api.patch(`/sales/${selectedOrder.id}/status`, { status });
      notify.success('وضعیت فاکتور بروزرسانی شد');
      await viewOrderDetails(selectedOrder.id);
      fetchSales();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'خطا در بروزرسانی');
    }
  };

  const term = search.trim().toLowerCase();
  const visibleOrders = salesOrders.filter((o: any) =>
    !term || [o.order_number, o.customer_name, o.customer_phone].some((v) => String(v || '').toLowerCase().includes(term))
  );
  // لغو و مرجوعی در جمع فروش حساب نمی‌شود
  const activeOrders = salesOrders.filter((o: any) => o.status !== 'cancelled' && o.status !== 'returned');

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

  return (
    <div className="space-y-6">
      <StatCards
        cards={[
          { label: 'تعداد فاکتورها', value: activeOrders.length, unit: 'فاکتور', icon: ShoppingCart, tone: 'emerald' },
          {
            label: 'مجموع فروش',
            value: activeOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: DollarSign,
            tone: 'blue',
          },
          {
            label: 'دریافت شده',
            value: activeOrders.reduce((sum: number, o: any) => sum + Number(o.paid_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: CheckCircle,
            tone: 'amber',
          },
          {
            label: 'قرض مشتریان',
            value: activeOrders.reduce((sum: number, o: any) => sum + Number(o.remaining_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: Clock,
            tone: 'red',
          },
        ]}
      />

      <div className="card-elevated !p-4 md:!p-8">
        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی فاکتور، مشتری یا شماره تماس..."
                className="w-full pr-10 pl-3 md:pl-4 h-11 md:h-12 text-sm md:text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <button className="btn-secondary h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0" title="فیلتر" aria-label="فیلتر">
            <Filter className="w-5 h-5" />
            <span className="hidden md:inline text-slate-700">فیلتر</span>
          </button>
          <button
            onClick={openAddModal}
            className="btn-primary whitespace-nowrap justify-center h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0 !gap-1.5 md:!gap-3 text-sm md:text-base"
          >
            <Plus className="md:w-5 md:h-5 w-4 h-4" />
            <span className="md:inline hidden">ثبت فاکتور فروش</span>
            <span className="md:hidden inline">ثبت</span>
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">شماره فاکتور</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">تاریخ</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">مشتری</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">مبلغ کل</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">وضعیت</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order: any) => {
                const status = statusOf(SALES_STATUS, order.status);
                return (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{order.order_number}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{formatDate(order.order_date)}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{order.customer_name}</td>
                  <td className="py-4 px-4 text-price">{Number(order.total_amount).toLocaleString()} افغانی</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => viewOrderDetails(order.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      جزئیات
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4">
          {visibleOrders.map((order: any) => {
            const status = statusOf(SALES_STATUS, order.status);
            return (
            <div key={order.id} className="card p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-label text-primary-600">{order.order_number}</div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${status.className}`}>
                    {status.label}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-medium text-slate-800 mb-1">{order.customer_name}</div>
                  <div className="text-caption text-slate-600">{formatDate(order.order_date)}</div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="text-caption text-slate-600">مبلغ کل</div>
                  <div className="flex items-center gap-2">
                    <div className="text-currency">{Number(order.total_amount).toLocaleString()} افغانی</div>
                    <button
                      onClick={() => viewOrderDetails(order.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-medium"
                    >
                      <Eye className="w-3 h-3" />
                      جزئیات
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Add Sale Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">ثبت فاکتور فروش</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSale} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">مشتری *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => changeCustomer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">انتخاب مشتری</option>
                    {customers.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>{customer.name} — {customer.phone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع فروش *</label>
                  <select
                    value={formData.sale_type}
                    onChange={(e) => changeSaleType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="retail">پرچون (قیمت پرچون)</option>
                    <option value="wholesale">عمده (قیمت عمده)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ *</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع پرداخت *</label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {SALE_PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تخفیف (افغانی)</label>
                  <input
                    type="number"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({...formData, discount_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">مبلغ دریافتی</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({...formData, paid_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder={formData.payment_type === 'قرض' ? '0' : 'خالی = کل مبلغ'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">یادداشت</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows={2}
                  placeholder="آدرس ارسال برای سفارش آنلاین، ..."
                ></textarea>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800">اقلام فاکتور</h4>
                  <button type="button" onClick={addItem} className="btn-secondary text-sm px-3 py-1">
                    <Plus className="w-4 h-4" />
                    افزودن قلم
                  </button>
                </div>

                {formData.items.map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
                    <div>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        required
                      >
                        <option value="">محصول</option>
                        {products.map((product: any) => (
                          <option key={product.id} value={product.id} disabled={Number(product.stock_quantity) <= 0}>
                            {product.name} (موجود: {Number(product.stock_quantity).toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="تعداد"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="قیمت واحد"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-slate-800">
                        {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                      </div>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">قابل پرداخت:</span>
                    <span className="text-xl font-black text-blue-600">
                      {total.toLocaleString()} افغانی
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">انصراف</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">ثبت فاکتور</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Sales Order Details Modal */}
      {showInvoiceModal && selectedOrder && (
        <Modal onClose={() => setShowInvoiceModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">جزئیات فاکتور فروش {selectedOrder.order_number}</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">شماره فاکتور:</p>
                  <p className="font-bold">{selectedOrder.order_number} ({selectedOrder.sale_type === 'wholesale' ? 'عمده' : 'پرچون'})</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">تاریخ:</p>
                  <p className="font-bold">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">مشتری:</p>
                  <p className="font-bold">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">وضعیت:</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusOf(SALES_STATUS, selectedOrder.status).className}`}>
                    {statusOf(SALES_STATUS, selectedOrder.status).label}
                  </span>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="font-bold mb-3">جزئیات محصولات:</h4>
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-right p-3 text-sm font-semibold">محصول</th>
                          <th className="text-right p-3 text-sm font-semibold">مقدار</th>
                          <th className="text-right p-3 text-sm font-semibold">قیمت واحد</th>
                          <th className="text-right p-3 text-sm font-semibold">جمع</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.product_name}</td>
                            <td className="p-3">{Number(item.quantity).toLocaleString()} {item.unit}</td>
                            <td className="p-3">{Number(item.unit_price).toLocaleString()} افغانی</td>
                            <td className="p-3 font-bold">{Number(item.total_price).toLocaleString()} افغانی</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">مبلغ کل{Number(selectedOrder.discount_amount) > 0 ? ` (تخفیف ${Number(selectedOrder.discount_amount).toLocaleString()})` : ''}:</p>
                  <p className="font-bold text-lg">{Number(selectedOrder.total_amount).toLocaleString()} افغانی</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">دریافت شده:</p>
                  <p className="font-bold text-lg text-emerald-600">{Number(selectedOrder.paid_amount).toLocaleString()} افغانی</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">مانده قرض:</p>
                  <p className="font-bold text-lg text-red-600">{Number(selectedOrder.remaining_amount).toLocaleString()} افغانی</p>
                </div>
              </div>

              {Number(selectedOrder.remaining_amount) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                  <input
                    type="number"
                    value={payment.amount}
                    onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="مبلغ دریافتی از قرض"
                  />
                  <select
                    value={payment.payment_method}
                    onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {SALE_PAYMENT_TYPES.filter((t) => t !== 'قرض' && !t.startsWith('نیمه')).map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={handleReceivePayment}
                    disabled={!(Number(payment.amount) > 0)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                  >
                    ثبت دریافت قرض
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-6">
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">بستن</button>
              {canManage && selectedOrder.status === 'processing' && (
                <button onClick={() => handleChangeStatus('delivered')} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600">تحویل شد</button>
              )}
              {canManage && !['cancelled', 'returned'].includes(selectedOrder.status) && (
                <button
                  onClick={() => handleChangeStatus(selectedOrder.status === 'delivered' ? 'returned' : 'cancelled')}
                  className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                >
                  {selectedOrder.status === 'delivered' ? 'مرجوعی' : 'لغو فاکتور'}
                </button>
              )}
              <button onClick={() => window.print()} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">چاپ فاکتور</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Sales;
