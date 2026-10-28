import { Users, Plus, Search, Filter, Phone, Mail, MapPin, Eye, X, UserCheck, ShoppingCart, DollarSign, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import Modal from '../components/Modal';
import StatCards from '../components/StatCards';
import { CUSTOMER_TYPES } from '../lib/cosmetics';

const emptyForm = { name: '', contact_person: '', phone: '', email: '', address: '', customer_type: 'wholesale', credit_limit: '' };

// مانده حساب: بدهکار قرمز، بستانکار سبز
const debtColor = (customer: any) => {
  const debt = Number(customer.total_debt || 0);
  return debt > 0 ? 'text-red-600' : debt < 0 ? 'text-emerald-600' : 'text-slate-800';
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customers');
      setCustomers(response.data.data);
    } catch (error) {
      console.error('خطا در دریافت مشتریان:', error);
      notify.error('خطا در دریافت مشتریان');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customers', formData);
      notify.success('مشتری با موفقیت اضافه شد');
      setShowAddModal(false);
      setFormData(emptyForm);
      fetchCustomers();
    } catch (error: any) {
      console.error('خطا در افزودن مشتری:', error);
      notify.error(error.response?.data?.message || 'خطا در افزودن مشتری');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!(await confirmDialog({ title: 'حذف مشتری', message: 'این مشتری برای همیشه حذف می‌شود و قابل بازگشت نیست.', confirmText: 'حذف', danger: true }))) return;
    try {
      await api.delete(`/customers/${id}`);
      notify.success('مشتری با موفقیت حذف شد');
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('خطا در حذف مشتری:', error);
      notify.error(error.response?.data?.message || 'خطا در حذف مشتری');
    }
  };

  const term = search.trim().toLowerCase();
  const visibleCustomers = customers.filter((c: any) =>
    !term || [c.name, c.phone, c.address, c.contact_person].some((v) => String(v || '').toLowerCase().includes(term))
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
          { label: 'کل مشتریان', value: customers.length, unit: 'نفر', icon: Users, tone: 'blue' },
          {
            label: 'مشتریان فعال',
            value: customers.filter((c: any) => c.status === 'active').length,
            unit: 'نفر',
            icon: UserCheck,
            tone: 'emerald',
          },
          {
            label: 'تعداد سفارشات',
            value: customers.reduce((sum: number, c: any) => sum + Number(c.total_orders), 0),
            unit: 'سفارش',
            icon: ShoppingCart,
            tone: 'amber',
          },
          {
            label: 'مجموع خرید مشتریان',
            value: customers.reduce((sum: number, c: any) => sum + Number(c.total_amount), 0).toLocaleString(),
            unit: 'افغانی',
            icon: DollarSign,
            tone: 'purple',
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
                placeholder="جستجوی مشتری، شماره تماس یا آدرس..."
                className="w-full pr-10 pl-3 md:pl-4 h-11 md:h-12 text-sm md:text-base border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>
          <button className="btn-secondary h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0" title="فیلتر" aria-label="فیلتر">
            <Filter className="w-5 h-5" />
            <span className="hidden md:inline text-slate-700">فیلتر</span>
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary whitespace-nowrap justify-center h-11 md:h-12 !px-3 md:!px-5 !py-0 flex-shrink-0 !gap-1.5 md:!gap-3 text-sm md:text-base"
          >
            <Plus className="md:w-5 md:h-5 w-4 h-4" />
            <span className="md:inline hidden">افزودن مشتری جدید</span>
            <span className="md:hidden inline">افزودن</span>
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">نام مشتری</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">شماره تماس</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">آدرس</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">مانده حساب</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {visibleCustomers.map((customer: any) => (
                <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4 text-sm font-medium text-slate-800">{customer.name}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{customer.phone}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{customer.address || '—'}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">
                    <span data-sensitive className={`font-bold ${debtColor(customer)}`}>
                      {Math.abs(Number(customer.total_debt || 0)).toLocaleString()}
                    </span>{' '}
                    افغانی
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        پروفایل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {visibleCustomers.map((customer: any) => (
            <div key={customer.id} className="glass-card rounded-2xl p-4 hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800 mb-1">{customer.name}</div>
                  <div className="text-xs text-slate-600 mb-2">{customer.phone} • {customer.address || '—'}</div>
                  <div className="text-sm text-slate-800">
                    مانده حساب:{' '}
                    <span data-sensitive className={`font-bold ${debtColor(customer)}`}>
                      {Math.abs(Number(customer.total_debt || 0)).toLocaleString()}
                    </span>{' '}
                    افغانی
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-medium"
                  >
                    <Eye className="w-3 h-3" />
                    پروفایل
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-subheading">افزودن مشتری جدید</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام شرکت/فروشگاه</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                    placeholder="نام مشتری"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نام مسئول</label>
                  <input 
                    type="text" 
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                    placeholder="نام مسئول"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">شماره تماس</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                    placeholder="0799123456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ایمیل</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">نوع مشتری</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({...formData, customer_type: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(CUSTOMER_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">سقف قرض (افغانی)</label>
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({...formData, credit_limit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0 = بدون قرض"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">آدرس</label>
                <textarea 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500" 
                  rows={3}
                  placeholder="آدرس کامل"
                ></textarea>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">انصراف</button>
                <button type="submit" className="btn-primary flex-1">ذخیره مشتری</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <Modal onClose={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">پروفایل مشتری</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-slate-800 mb-2">{selectedCustomer.name}</h4>
                  <p className="text-slate-600 mb-4">
                    {CUSTOMER_TYPES[selectedCustomer.customer_type] || ''}
                    {selectedCustomer.contact_person ? ` • ${selectedCustomer.contact_person}` : ''}
                    {Number(selectedCustomer.credit_limit) > 0 ? ` • سقف قرض: ${Number(selectedCustomer.credit_limit).toLocaleString()} افغانی` : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-700">{selectedCustomer.phone}</span>
                    </div>
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-700">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-700">{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm text-slate-600 mb-2">تعداد سفارشات</p>
                  <p className="text-xl font-bold text-slate-800">{selectedCustomer.total_orders || 0}</p>
                </div>
                <div className="glass-card p-4 rounded-xl">
                  <p className="text-sm text-slate-600 mb-2">مجموع خرید</p>
                  <p className="text-xl font-bold text-blue-600">{Number(selectedCustomer.total_amount || 0).toLocaleString()} افغانی</p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                حذف مشتری
              </button>
              <button onClick={() => setSelectedCustomer(null)} className="btn-secondary px-5 py-2 text-sm">
                بستن
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Customers;
