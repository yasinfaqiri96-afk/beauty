import { TrendingUp, Plus, Search, Filter, Phone, MapPin, X, DollarSign, CheckCircle, Star, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import Modal from '../components/Modal';
import StatCards from '../components/StatCards';
import { CURRENCIES } from '../lib/cosmetics';

const emptyForm = {
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  country: '',
  currency: 'AFN',
  products: '',
  rating: 5
};

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState<any>(emptyForm);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/suppliers');
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('خطا در دریافت تامینکنندگان:', error);
      notify.error('خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', formData);
      notify.success('تامینکننده با موفقیت اضافه شد');
      setShowAddModal(false);
      setFormData(emptyForm);
      fetchSuppliers();
    } catch (error: any) {
      console.error('خطا در افزودن تامینکننده:', error);
      notify.error(error.response?.data?.message || 'خطا در افزودن تامینکننده');
    }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/suppliers/${editingSupplier.id}`, formData);
      notify.success('تامینکننده با موفقیت ویرایش شد');
      setShowEditModal(false);
      setEditingSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      console.error('خطا در ویرایش تامینکننده:', error);
      notify.error(error.response?.data?.message || 'خطا در ویرایش تامینکننده');
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!(await confirmDialog({ title: 'حذف تامین‌کننده', message: 'این تامین‌کننده برای همیشه حذف می‌شود و قابل بازگشت نیست.', confirmText: 'حذف', danger: true }))) return;
    try {
      await api.delete(`/suppliers/${id}`);
      notify.success('تامینکننده با موفقیت حذف شد');
      fetchSuppliers();
    } catch (error: any) {
      console.error('خطا در حذف تامینکننده:', error);
      notify.error(error.response?.data?.message || 'خطا در حذف تامینکننده');
    }
  };

  const term = search.trim().toLowerCase();
  const visibleSuppliers = suppliers.filter((s: any) =>
    !term || [s.name, s.products, s.address, s.country, s.phone].some((v) => String(v || '').toLowerCase().includes(term))
  );

  const openEditModal = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address || '',
      country: supplier.country || '',
      currency: supplier.currency || 'AFN',
      products: supplier.products || '',
      rating: supplier.rating
    });
    setShowEditModal(true);
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

  return (
    <div className="space-y-6">
      <StatCards
        cards={[
          { label: 'کل تامینکنندگان', value: suppliers.length, unit: 'تامینکننده', icon: TrendingUp, tone: 'blue' },
          {
            label: 'تامینکنندگان فعال',
            value: suppliers.filter((s: any) => s.status === 'active').length,
            unit: 'تامینکننده',
            icon: CheckCircle,
            tone: 'emerald',
          },
          {
            label: 'میانگین امتیاز',
            value: suppliers.length > 0 ? (suppliers.reduce((sum: number, s: any) => sum + Number(s.rating), 0) / suppliers.length).toFixed(1) : '0',
            unit: 'از ۵',
            icon: Star,
            tone: 'amber',
          },
          {
            label: 'بدهی به تامینکنندگان',
            value: suppliers.reduce((sum: number, s: any) => sum + Number(s.debt), 0).toLocaleString(),
            unit: 'افغانی',
            icon: DollarSign,
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
                placeholder="جستجوی تامینکننده، برند یا کشور..."
                className="w-full pr-10 pl-3 md:pl-4 h-11 md:h-12 text-sm md:text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <button className="btn-secondary h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0" title="فیلتر" aria-label="فیلتر">
            <Filter className="w-5 h-5 text-slate-600" />
            <span className="hidden md:inline text-slate-700">فیلتر</span>
          </button>
          <button 
            onClick={() => { setFormData(emptyForm); setShowAddModal(true); }}
            className="btn-primary whitespace-nowrap justify-center h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0 !gap-1.5 md:!gap-3 text-sm md:text-base"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="md:inline hidden">افزودن تامینکننده جدید</span>
            <span className="md:hidden inline">افزودن</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {visibleSuppliers.map((supplier: any) => (
            <div key={supplier.id} className="glass-card rounded-xl md:rounded-2xl p-3 md:p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6">
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="w-11 h-11 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-2xl flex-shrink-0">
                    {supplier.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-slate-800 mb-1.5 md:mb-3 truncate">{supplier.name}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{supplier.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        <span className="flex items-baseline gap-1.5">
                          مانده حساب
                          {/* بدهی ما به تامینکننده: قرمز، طلب ما: سبز */}
                          <span data-sensitive className={`text-base font-bold ${
                            Number(supplier.debt || 0) > 0 ? 'text-red-600' : Number(supplier.debt || 0) < 0 ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {Math.abs(Number(supplier.debt || 0)).toLocaleString()}
                          </span>
                          افغانی
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{[supplier.country, supplier.address].filter(Boolean).join('، ') || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end lg:justify-start gap-2 pt-2.5 md:pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-r border-slate-200 lg:pr-6">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs md:text-sm font-medium"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => handleDeleteSupplier(supplier.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 md:py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-xs md:text-sm font-medium"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">افزودن تامینکننده جدید</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام شرکت *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام تماس *</label>
                  <input 
                    type="text" 
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تلفن *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ایمیل</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">آدرس</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">کشور</label>
                  <input 
                    type="text" 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="امارات، پاکستان، ایران، ترکیه..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسعار معامله</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  >
                    {Object.entries(CURRENCIES).map(([code, label]) => <option key={code} value={code}>{label} ({code})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">محصولات</label>
                <input 
                  type="text" 
                  value={formData.products}
                  onChange={(e) => setFormData({...formData, products: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="برندها: نیوآ، گارنیه، گلدن رز..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">امتیاز (۱-۵)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary px-6 py-3 flex-1">ذخیره</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary px-6 py-3">لغو</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && editingSupplier && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">ویرایش تامینکننده</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSupplier} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام شرکت *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام تماس *</label>
                  <input 
                    type="text" 
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">تلفن *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ایمیل</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">آدرس</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">کشور</label>
                  <input 
                    type="text" 
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="امارات، پاکستان، ایران، ترکیه..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسعار معامله</label>
                  <select 
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  >
                    {Object.entries(CURRENCIES).map(([code, label]) => <option key={code} value={code}>{label} ({code})</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">محصولات</label>
                <input 
                  type="text" 
                  value={formData.products}
                  onChange={(e) => setFormData({...formData, products: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">امتیاز (۱-۵)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: Number(e.target.value)})}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary px-6 py-3 flex-1">ذخیره تغییرات</button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary px-6 py-3">لغو</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Suppliers;