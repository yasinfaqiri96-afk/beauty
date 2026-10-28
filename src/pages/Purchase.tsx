import { ShoppingBag, Plus, Search, Filter, Eye, X, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES, PURCHASE_PAYMENT_TYPES, PURCHASE_STATUS, statusOf, formatDate, today } from '../lib/cosmetics';
import Modal from '../components/Modal';
import StatCards from '../components/StatCards';

const emptyItem = { product_id: '', quantity: '', unit_price: '', batch_number: '', expiry_date: '' };

const emptyForm = () => ({
  supplier_id: '',
  order_date: today(),
  delivery_date: '',
  status: 'received',
  currency: 'AFN',
  exchange_rate: '1',
  shipping_cost: '',
  customs_cost: '',
  payment_type: 'نقدی',
  paid_amount: '',
  notes: '',
  items: [{ ...emptyItem }]
});

function Purchase() {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [formData, setFormData] = useState<any>(emptyForm());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        api.get('/purchase'),
        api.get('/suppliers'),
        api.get('/products')
      ]);
      setPurchaseOrders(ordersRes.data.data);
      setSuppliers(suppliersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('خطا در دریافت داده‌ها:', error);
      notify.error('خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  // جمع اقلام به اسعار سفارش و مبلغ کل به افغانی (با کرایه و گمرک)
  const itemsTotal = formData.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
  const rate = formData.currency === 'AFN' ? 1 : Number(formData.exchange_rate) || 0;
  const totalAfn = itemsTotal * rate + (Number(formData.shipping_cost) || 0) + (Number(formData.customs_cost) || 0);

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = formData.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        batch_number: item.batch_number,
        expiry_date: item.expiry_date || null
      }));

      await api.post('/purchase', {
        ...formData,
        exchange_rate: rate,
        shipping_cost: Number(formData.shipping_cost) || 0,
        customs_cost: Number(formData.customs_cost) || 0,
        paid_amount: Number(formData.paid_amount) || 0,
        items
      });

      notify.success('سفارش خرید با موفقیت ثبت شد');
      setShowAddModal(false);
      setFormData(emptyForm());
      fetchData();
    } catch (error: any) {
      console.error('خطا در ثبت سفارش:', error);
      notify.error(error.response?.data?.message || 'خطا در ثبت سفارش');
    }
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await api.get(`/purchase/${orderId}`);
      setSelectedOrder(response.data.data);
      setPayAmount('');
      setShowDetailsModal(true);
    } catch (error) {
      console.error('خطا در دریافت جزئیات:', error);
      notify.error('خطا در دریافت جزئیات');
    }
  };

  const handleReceive = async () => {
    try {
      await api.patch(`/purchase/${selectedOrder.id}/status`, { status: 'received' });
      notify.success('کالا وارد انبار شد');
      await viewOrderDetails(selectedOrder.id);
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'خطا در تحویل گرفتن');
    }
  };

  const handlePay = async () => {
    try {
      await api.post(`/purchase/${selectedOrder.id}/payments`, { amount: Number(payAmount), payment_method: 'نقدی' });
      notify.success('پرداخت ثبت شد');
      await viewOrderDetails(selectedOrder.id);
      fetchData();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'خطا در ثبت پرداخت');
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!(await confirmDialog({ title: 'حذف سفارش خرید', message: 'این سفارش خرید و کالای واردشده آن از انبار حذف می‌شود و قابل بازگشت نیست.', confirmText: 'حذف', danger: true }))) return;
    try {
      await api.delete(`/purchase/${id}`);
      notify.success('سفارش با موفقیت حذف شد');
      setShowDetailsModal(false);
      fetchData();
    } catch (error: any) {
      console.error('خطا در حذف:', error);
      notify.error(error.response?.data?.message || 'خطا در حذف سفارش');
    }
  };

  const changeSupplier = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    const currency = supplier?.currency || 'AFN';
    setFormData({ ...formData, supplier_id: supplierId, currency, exchange_rate: currency === 'AFN' ? '1' : '' });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const tracksExpiry = (productId: string) => Boolean(products.find((p) => p.id === productId)?.track_expiry ?? true);

  const term = search.trim().toLowerCase();
  const visibleOrders = purchaseOrders.filter((o: any) =>
    !term || [o.order_number, o.supplier_name].some((v) => String(v || '').toLowerCase().includes(term))
  );
  const activeOrders = purchaseOrders.filter((o: any) => o.status !== 'cancelled');

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
          { label: 'تعداد سفارشات', value: activeOrders.length, unit: 'سفارش', icon: ShoppingBag, tone: 'purple' },
          {
            label: 'مجموع خرید',
            value: activeOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: DollarSign,
            tone: 'blue',
          },
          {
            label: 'پرداخت شده',
            value: activeOrders.reduce((sum: number, o: any) => sum + Number(o.paid_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: CheckCircle,
            tone: 'emerald',
          },
          {
            label: 'مانده بدهی',
            value: activeOrders.reduce((sum: number, o: any) => sum + Number(o.remaining_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: Clock,
            tone: 'red',
          },
        ]}
      />

      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-6">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی سفارش یا تامینکننده..."
                className="w-full pr-10 pl-3 md:pl-4 h-11 md:h-12 text-sm md:text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <button className="btn-secondary h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0" title="فیلتر" aria-label="فیلتر">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="hidden md:inline text-slate-700">فیلتر</span>
          </button>
          <button
            onClick={() => { setFormData(emptyForm()); setShowAddModal(true); }}
            className="btn-primary whitespace-nowrap justify-center h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0 !gap-1.5 md:!gap-3 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="md:inline hidden">ثبت سفارش خرید جدید</span>
            <span className="md:hidden inline">ثبت</span>
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">شماره سفارش</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">تاریخ</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">تامینکننده</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">مبلغ کل</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">وضعیت</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order: any) => {
                const status = statusOf(PURCHASE_STATUS, order.status);
                return (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{order.order_number}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{formatDate(order.order_date)}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{order.supplier_name}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{Number(order.total_amount).toLocaleString()} افغانی</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewOrderDetails(order.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        جزئیات
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {visibleOrders.map((order: any) => (
            <div key={order.id} className="glass-card rounded-2xl p-4 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800 mb-1">{order.order_number} — {order.supplier_name}</div>
                  <div className="text-xs text-slate-600 mb-2">{formatDate(order.order_date)} • {statusOf(PURCHASE_STATUS, order.status).label}</div>
                  <div className="text-sm font-medium text-slate-800">مبلغ: {Number(order.total_amount).toLocaleString()} افغانی</div>
                </div>
                <button
                  onClick={() => viewOrderDetails(order.id)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-medium"
                >
                  <Eye className="w-3 h-3" />
                  جزئیات
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">ثبت سفارش خرید جدید</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPurchase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تامینکننده *</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => changeSupplier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">انتخاب تامینکننده</option>
                    {suppliers.map((supplier: any) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">وضعیت کالا *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="received">تحویل گرفته شد (ورود فوری به انبار)</option>
                    <option value="shipping">در راه / گمرک</option>
                    <option value="pending">سفارش داده شده</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ سفارش *</label>
                  <input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ تحویل</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => setFormData({...formData, delivery_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسعار خرید *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value, exchange_rate: e.target.value === 'AFN' ? '1' : ''})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {Object.entries(CURRENCIES).map(([code, label]) => <option key={code} value={code}>{label} ({code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نرخ تبادله (۱ واحد = ? افغانی)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.currency === 'AFN' ? '1' : formData.exchange_rate}
                    onChange={(e) => setFormData({...formData, exchange_rate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    disabled={formData.currency === 'AFN'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">کرایه حمل (افغانی)</label>
                  <input
                    type="number"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({...formData, shipping_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">محصول گمرکی (افغانی)</label>
                  <input
                    type="number"
                    value={formData.customs_cost}
                    onChange={(e) => setFormData({...formData, customs_cost: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع پرداخت *</label>
                  <select
                    value={formData.payment_type}
                    onChange={(e) => setFormData({...formData, payment_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {PURCHASE_PAYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">مبلغ پرداختی (افغانی)</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({...formData, paid_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">یادداشت</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  rows={2}
                ></textarea>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800">اقلام سفارش</h4>
                  <button type="button" onClick={addItem} className="btn-secondary text-sm px-3 py-1">
                    <Plus className="w-4 h-4" />
                    افزودن قلم
                  </button>
                </div>

                {formData.items.map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-3 p-3 bg-slate-50 rounded-lg">
                    <div>
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        required
                      >
                        <option value="">محصول</option>
                        {products.map((product: any) => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        step="1"
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
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder={`قیمت واحد (${CURRENCIES[formData.currency]})`}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.batch_number}
                        onChange={(e) => updateItem(index, 'batch_number', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="شماره بچ / لات"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => updateItem(index, 'expiry_date', e.target.value)}
                        className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                        title="تاریخ انقضا"
                        required={item.product_id ? tracksExpiry(item.product_id) : false}
                        disabled={item.product_id ? !tracksExpiry(item.product_id) : false}
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
                    <span className="font-bold text-slate-800">مبلغ کل (با کرایه و گمرک):</span>
                    <span className="text-xl font-black text-blue-600">
                      {Math.round(totalAfn).toLocaleString()} افغانی
                    </span>
                  </div>
                  {formData.currency !== 'AFN' && (
                    <p className="text-xs text-slate-600 mt-1">جمع اقلام: {itemsTotal.toLocaleString()} {CURRENCIES[formData.currency]}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">انصراف</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">ثبت سفارش</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Purchase Details Modal */}
      {showDetailsModal && selectedOrder && (
        <Modal onClose={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">جزئیات سفارش خرید {selectedOrder.order_number}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">شماره سفارش:</p>
                  <p className="font-bold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">تاریخ:</p>
                  <p className="font-bold">{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">تامینکننده:</p>
                  <p className="font-bold">{selectedOrder.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">وضعیت:</p>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusOf(PURCHASE_STATUS, selectedOrder.status).className}`}>
                    {statusOf(PURCHASE_STATUS, selectedOrder.status).label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600">اسعار / نرخ:</p>
                  <p className="font-bold">{CURRENCIES[selectedOrder.currency] || selectedOrder.currency} / {Number(selectedOrder.exchange_rate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">کرایه + گمرک:</p>
                  <p className="font-bold">{(Number(selectedOrder.shipping_cost) + Number(selectedOrder.customs_cost)).toLocaleString()} افغانی</p>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="font-bold mb-3">جزئیات محصولات:</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-right p-3 text-sm font-semibold">محصول</th>
                          <th className="text-right p-3 text-sm font-semibold">مقدار</th>
                          <th className="text-right p-3 text-sm font-semibold">قیمت تمام‌شده</th>
                          <th className="text-right p-3 text-sm font-semibold">انقضا</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">{item.product_name}{item.batch_number ? ` (${item.batch_number})` : ''}</td>
                            <td className="p-3">{Number(item.quantity).toLocaleString()}</td>
                            <td className="p-3">{Number(item.landed_cost).toLocaleString()} افغانی</td>
                            <td className="p-3">{formatDate(item.expiry_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">مبلغ کل:</p>
                  <p className="font-bold text-lg">{Number(selectedOrder.total_amount).toLocaleString()} افغانی</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">پرداخت شده:</p>
                  <p className="font-bold text-lg text-emerald-600">{Number(selectedOrder.paid_amount).toLocaleString()} افغانی</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">مانده:</p>
                  <p className="font-bold text-lg text-red-600">{Number(selectedOrder.remaining_amount).toLocaleString()} افغانی</p>
                </div>
              </div>

              {Number(selectedOrder.remaining_amount) > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-2 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="مبلغ پرداخت به تامینکننده"
                  />
                  <button
                    onClick={handlePay}
                    disabled={!(Number(payAmount) > 0)}
                    className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50"
                  >
                    ثبت پرداخت
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-6">
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">بستن</button>
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'shipping') && (
                <button onClick={handleReceive} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">تحویل گرفتم (ورود به انبار)</button>
              )}
              {user?.role === 'admin' && (
                <button onClick={() => handleDeletePurchase(selectedOrder.id)} className="flex-1 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">حذف</button>
              )}
              <button onClick={() => window.print()} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">چاپ سفارش</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Purchase;
