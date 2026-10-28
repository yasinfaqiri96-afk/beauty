import { Package, Plus, Search, Filter, Download, X, Layers, MapPin, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import { formatDate } from '../lib/cosmetics';
import Modal from '../components/Modal';
import StatCards from '../components/StatCards';

const emptyForm = { product_id: '', quantity: '', location: '', batch_number: '', expiry_date: '' };

// رنگ وضعیت بچ (وضعیت از سرور می‌آید)
const statusClass = (status: string) =>
  status === 'منقضی' ? 'bg-red-100 text-red-700' :
  status === 'نزدیک انقضا' ? 'bg-amber-100 text-amber-700' :
  status === 'کم' ? 'bg-red-100 text-red-700' :
  'bg-emerald-100 text-emerald-700';

function Warehouse() {
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [formData, setFormData] = useState<any>(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [stockRes, productsRes] = await Promise.all([
        api.get('/warehouse/stock'),
        api.get('/products')
      ]);
      setWarehouseStock(stockRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('خطا در دریافت داده‌ها:', error);
      notify.error('خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/warehouse/stock', {
        ...formData,
        quantity: Number(formData.quantity)
      });
      notify.success('موجودی با موفقیت اضافه شد');
      setShowAddModal(false);
      setFormData(emptyForm);
      fetchData();
    } catch (error: any) {
      console.error('خطا در افزودن موجودی:', error);
      notify.error(error.response?.data?.message || 'خطا در افزودن موجودی');
    }
  };

  const handleEditStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/warehouse/stock/${editingStock.id}`, {
        ...formData,
        quantity: Number(formData.quantity)
      });
      notify.success('موجودی با موفقیت ویرایش شد');
      setShowEditModal(false);
      setEditingStock(null);
      fetchData();
    } catch (error: any) {
      console.error('خطا در ویرایش موجودی:', error);
      notify.error(error.response?.data?.message || 'خطا در ویرایش موجودی');
    }
  };

  const handleDeleteStock = async (item: any) => {
    const expired = item.status === 'منقضی';
    if (!(await confirmDialog({
      title: expired ? 'معدوم کردن کالای منقضی' : 'خروج به عنوان ضایعات',
      message: `${Number(item.quantity).toLocaleString()} ${item.unit} «${item.product_name}» از موجودی خارج و به عنوان ${expired ? 'منقضی' : 'ضایعات'} ثبت می‌شود.`,
      confirmText: 'خارج کن',
      danger: true
    }))) return;
    try {
      const response = await api.delete(`/warehouse/stock/${item.id}`);
      notify.success(response.data.message || 'موجودی از انبار خارج شد');
      fetchData();
    } catch (error: any) {
      console.error('خطا در حذف موجودی:', error);
      notify.error(error.response?.data?.message || 'خطا در حذف موجودی');
    }
  };

  const openEditModal = (stock: any) => {
    setEditingStock(stock);
    setFormData({
      product_id: stock.product_id,
      quantity: stock.quantity,
      location: stock.location || '',
      batch_number: stock.batch_number || '',
      expiry_date: stock.expiry_date ? String(stock.expiry_date).split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const selectedTracksExpiry = Boolean(products.find((p) => p.id === formData.product_id)?.track_expiry ?? true);

  const term = search.trim().toLowerCase();
  const visibleStock = warehouseStock.filter((s: any) =>
    !term || [s.product_name, s.sku, s.brand, s.category, s.location, s.batch_number].some((v) => String(v || '').toLowerCase().includes(term))
  );

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
          { label: 'بچ‌های انبار', value: warehouseStock.length, unit: 'بچ', icon: Package, tone: 'blue' },
          {
            label: 'کل موجودی',
            value: warehouseStock.reduce((sum: number, s: any) => sum + Number(s.quantity), 0).toLocaleString(),
            unit: 'دانه',
            icon: Layers,
            tone: 'emerald',
          },
          {
            label: 'قفسه‌ها / ویترین‌ها',
            value: new Set(warehouseStock.map((s: any) => s.location).filter(Boolean)).size,
            unit: 'موقعیت',
            icon: MapPin,
            tone: 'amber',
          },
          {
            label: 'منقضی / نزدیک انقضا',
            value: warehouseStock.filter((s: any) => s.status === 'منقضی' || s.status === 'نزدیک انقضا').length,
            unit: 'بچ',
            icon: AlertTriangle,
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
                placeholder="جستجوی محصول، برند، بچ یا قفسه..."
                className="w-full pr-10 pl-3 md:pl-4 h-11 md:h-12 text-sm md:text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <button className="btn-secondary h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0" title="فیلتر" aria-label="فیلتر">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="hidden md:inline text-slate-700">فیلتر</span>
          </button>
          <button
            onClick={() => notify.info('دانلود فایل Excel')}
            className="btn-secondary h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0"
            title="خروجی Excel"
            aria-label="خروجی Excel"
          >
            <Download className="w-5 h-5 text-slate-600" />
            <span className="hidden md:inline text-slate-700">خروجی Excel</span>
          </button>
          <button
            onClick={() => { setFormData(emptyForm); setShowAddModal(true); }}
            className="btn-primary whitespace-nowrap justify-center h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0 !gap-1.5 md:!gap-3 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="md:inline hidden">افزودن موجودی جدید</span>
            <span className="md:hidden inline">افزودن</span>
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">بچ</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">نام محصول</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">تاریخ انقضا / قفسه</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">موجودی</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">وضعیت</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {visibleStock.map((item: any, index: number) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{item.batch_number || `#${String(index + 1).padStart(3, '0')}`}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-lg">
                        <Package className="w-5 h-5 text-amber-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-800">{item.product_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-700">{formatDate(item.expiry_date)} • {item.location || '—'}</td>
                  <td className="py-4 px-4">
                    <span className="text-lg font-bold text-primary-600">{Number(item.quantity).toLocaleString()}</span>
                    <span className="text-sm text-primary-600 mr-1">{item.unit}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-all duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStock(item)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {visibleStock.map((item: any) => (
            <div key={item.id} className="glass-card rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{item.product_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{item.batch_number || '—'} • انقضا: {formatDate(item.expiry_date)} • {item.location || '—'}</div>
                </div>
                <span className={`flex-shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-base font-bold text-primary-600">{Number(item.quantity).toLocaleString()}</span>
                  <span className="text-xs text-primary-600 mr-1">{item.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                    aria-label="ویرایش"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStock(item)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                    aria-label="خروج ضایعات"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">نمایش {visibleStock.length.toLocaleString('fa-AF')} از {warehouseStock.length.toLocaleString('fa-AF')} بچ</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 btn-secondary rounded-lg text-sm">قبلی</button>
            <button className="px-4 py-2 btn-primary rounded-lg text-sm">۱</button>
            <button className="px-4 py-2 btn-secondary rounded-lg text-sm">بعدی</button>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">افزودن موجودی جدید (بچ جدید)</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStock} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">محصول *</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">انتخاب محصول</option>
                    {products.map((product: any) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تعداد *</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="تعداد"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">شماره بچ / لات</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="LOT-2501"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ انقضا {selectedTracksExpiry ? '*' : ''}</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    required={selectedTracksExpiry}
                    disabled={!selectedTracksExpiry}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">قفسه / ویترین *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="قفسه A-1"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">انصراف</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">ذخیره</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Stock Modal */}
      {showEditModal && editingStock && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">اصلاح شمارش «{editingStock.product_name}»</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStock} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تعداد شمرده‌شده *</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="تعداد"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">شماره بچ / لات</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ انقضا</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">قفسه / ویترین *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder="قفسه A-1"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">انصراف</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">ذخیره تغییرات</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Warehouse;
