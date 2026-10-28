import { Package, Plus, Search, Filter, Edit, Trash2, X, Eye, Layers, DollarSign, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, formatDate } from '../lib/cosmetics';
import Modal from '../components/Modal';
import StatCards from '../components/StatCards';

const emptyForm = {
  sku: '',
  barcode: '',
  name: '',
  brand: '',
  category: '',
  origin: '',
  purchase_price: '',
  sale_price: '',
  wholesale_price: '',
  stock_quantity: '',
  min_stock_quantity: '',
  unit: 'دانه',
  track_expiry: true,
  batch_number: '',
  expiry_date: '',
  location: ''
};

// وضعیت محصول: کالای منقضی و نزدیک انقضا مهم‌تر از کمبود موجودی است
const productBadge = (product: any) => {
  if (Number(product.expired_quantity) > 0) return { label: 'منقضی دارد', className: 'bg-red-100 text-red-700' };
  if (Number(product.near_expiry_quantity) > 0) return { label: 'نزدیک انقضا', className: 'bg-amber-100 text-amber-700' };
  if (Number(product.stock_quantity) <= Number(product.min_stock_quantity)) return { label: 'کم', className: 'bg-red-100 text-red-700' };
  return { label: 'کافی', className: 'bg-emerald-100 text-emerald-700' };
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>(emptyForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data.data);
    } catch (error) {
      console.error('خطا در دریافت محصولات:', error);
      notify.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setShowAddModal(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      ...emptyForm,
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      brand: product.brand || '',
      category: product.category,
      origin: product.origin || '',
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      wholesale_price: product.wholesale_price || '',
      min_stock_quantity: product.min_stock_quantity,
      unit: product.unit || 'دانه',
      track_expiry: Boolean(product.track_expiry),
      status: product.status
    });
    setShowAddModal(true);
  };

  const viewProductDetails = async (id: string) => {
    try {
      const response = await api.get(`/products/${id}`);
      setSelectedProduct(response.data.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('خطا در دریافت جزئیات:', error);
      notify.error('خطا در دریافت جزئیات');
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        notify.success('محصول با موفقیت ویرایش شد');
      } else {
        await api.post('/products', formData);
        notify.success('محصول با موفقیت اضافه شد');
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setFormData(emptyForm);
      fetchProducts();
    } catch (error: any) {
      console.error('خطا در ذخیره محصول:', error);
      notify.error(error.response?.data?.message || 'خطا در ذخیره محصول');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!(await confirmDialog({ title: 'حذف محصول', message: 'این محصول حذف می‌شود؛ اگر سابقه خرید یا فروش داشته باشد فقط غیرفعال می‌شود.', confirmText: 'حذف', danger: true }))) return;
    try {
      const response = await api.delete(`/products/${id}`);
      notify.success(response.data.message || 'محصول با موفقیت حذف شد');
      fetchProducts();
    } catch (error: any) {
      console.error('خطا در حذف محصول:', error);
      notify.error(error.response?.data?.message || 'خطا در حذف محصول');
    }
  };

  const term = search.trim().toLowerCase();
  const visibleProducts = products.filter((p: any) =>
    !term || [p.name, p.sku, p.barcode, p.brand, p.category].some((v) => String(v || '').toLowerCase().includes(term))
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
          { label: 'کل محصولات', value: products.length, unit: 'محصول', icon: Package, tone: 'blue' },
          {
            label: 'کل موجودی',
            value: products.reduce((sum: number, p: any) => sum + Number(p.stock_quantity), 0).toLocaleString(),
            unit: 'دانه',
            icon: Layers,
            tone: 'emerald',
          },
          {
            label: 'ارزش موجودی',
            value: products.reduce((sum: number, p: any) => sum + Number(p.stock_quantity) * Number(p.purchase_price), 0).toLocaleString(),
            unit: 'افغانی',
            icon: DollarSign,
            tone: 'amber',
          },
          {
            label: 'موجودی کم / منقضی',
            value: products.filter((p: any) => Number(p.stock_quantity) <= Number(p.min_stock_quantity) || Number(p.expired_quantity) > 0).length,
            unit: 'محصول',
            icon: AlertTriangle,
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
                placeholder="جستجوی محصول، برند، بارکد یا کد کالا..."
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
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="md:inline hidden">افزودن محصول جدید</span>
            <span className="md:hidden inline">افزودن</span>
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">کد کالا</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">نام محصول</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">دستهبندی</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">موجودی</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">قیمت فروش</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">وضعیت</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product: any) => {
                const badge = productBadge(product);
                return (
                <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4 text-xs font-medium text-slate-800 whitespace-nowrap">{product.sku}</td>
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{product.name}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{product.category}</td>
                  <td className="py-4 px-4 text-sm font-bold text-slate-800">{Number(product.stock_quantity).toLocaleString()} {product.unit}</td>
                  <td className="py-4 px-4 text-price whitespace-nowrap">
                    {Number(product.sale_price).toLocaleString()}
                    <span className="text-base mr-1.5">افغانی</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewProductDetails(product.id)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
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
          {visibleProducts.map((product: any) => {
            const badge = productBadge(product);
            return (
            <div key={product.id} className="card !p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{product.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    <span className="text-primary-600 font-medium">{product.sku}</span> • {product.brand ? `${product.brand} • ` : ''}{product.category}
                  </div>
                </div>
                <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">موجودی: <span className="font-bold text-slate-800">{Number(product.stock_quantity).toLocaleString()} {product.unit}</span></div>
                  <div className="flex items-baseline gap-1 text-primary-600 whitespace-nowrap">
                    <span data-sensitive className="text-base font-bold">{Number(product.sale_price).toLocaleString()}</span>
                    <span className="text-xs">افغانی</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => viewProductDetails(product.id)}
                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                    aria-label="مشاهده"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50" aria-label="ویرایش">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-subheading">{editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">کد کالا</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="SKN-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">بارکد</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="بارکد روی بسته (اسکن یا تایپ)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام محصول</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="کرم نیوآ سافت ۲۰۰ ملی‌لیتر"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">برند</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nivea"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">دستهبندی</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">انتخاب دستهبندی</option>
                    {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">کشور ساخت</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ترکیه"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">قیمت خرید (تمام‌شده)</label>
                  <input
                    type="number"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">قیمت فروش پرچون</label>
                  <input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({...formData, sale_price: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="280"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">قیمت فروش عمده</label>
                  <input
                    type="number"
                    value={formData.wholesale_price}
                    onChange={(e) => setFormData({...formData, wholesale_price: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="245"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">واحد</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">حداقل موجودی</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.min_stock_quantity}
                    onChange={(e) => setFormData({...formData, min_stock_quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="24"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ انقضا دارد؟</label>
                  <select
                    value={formData.track_expiry ? '1' : '0'}
                    onChange={(e) => setFormData({...formData, track_expiry: e.target.value === '1'})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="1">بله (کرم، آرایشی، شامپو...)</option>
                    <option value="0">خیر (عطر، برس، لوازم جانبی)</option>
                  </select>
                </div>
                {!editingProduct && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">موجودی اولیه</label>
                      <input
                        type="number"
                        step="1"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="0"
                      />
                    </div>
                    {Number(formData.stock_quantity) > 0 && formData.track_expiry && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">تاریخ انقضای موجودی اولیه</label>
                        <input
                          type="date"
                          value={formData.expiry_date}
                          onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                    )}
                    {Number(formData.stock_quantity) > 0 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">شماره بچ / لات</label>
                          <input
                            type="text"
                            value={formData.batch_number}
                            onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="LOT-2501"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">قفسه / ویترین</label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="قفسه A-1"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">انصراف</button>
                <button type="submit" className="btn-primary flex-1">{editingProduct ? 'ذخیره تغییرات' : 'ذخیره محصول'}</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <Modal onClose={() => setShowDetailsModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">{selectedProduct.name}</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">کد کالا / بارکد:</p>
                  <p className="font-bold">{selectedProduct.sku} {selectedProduct.barcode ? `/ ${selectedProduct.barcode}` : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">برند و کشور:</p>
                  <p className="font-bold">{selectedProduct.brand || '—'} • {selectedProduct.origin || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">قیمت خرید / پرچون / عمده:</p>
                  <p className="font-bold">
                    {Number(selectedProduct.purchase_price).toLocaleString()} / {Number(selectedProduct.sale_price).toLocaleString()} / {Number(selectedProduct.wholesale_price || selectedProduct.sale_price).toLocaleString()} افغانی
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">موجودی:</p>
                  <p className="font-bold">{Number(selectedProduct.stock_quantity).toLocaleString()} {selectedProduct.unit}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-3">بچ‌های موجود (به ترتیب انقضا):</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-right p-3 text-sm font-semibold">شماره بچ</th>
                        <th className="text-right p-3 text-sm font-semibold">مقدار</th>
                        <th className="text-right p-3 text-sm font-semibold">تاریخ انقضا</th>
                        <th className="text-right p-3 text-sm font-semibold">قفسه</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedProduct.batches || []).map((batch: any) => (
                        <tr key={batch.id} className="border-t">
                          <td className="p-3">{batch.batch_number || '—'}</td>
                          <td className="p-3">{Number(batch.quantity).toLocaleString()}</td>
                          <td className="p-3">{formatDate(batch.expiry_date)}</td>
                          <td className="p-3">{batch.location || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={() => setShowDetailsModal(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">بستن</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Products;
