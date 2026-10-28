import { Building2, Plus, Search, Edit, Trash2, MapPin, Phone, User, X, CheckCircle, XCircle, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { notify, confirmDialog } from '../lib/feedback';
import StatCards from '../components/StatCards';

interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  manager_name: string;
  status: string;
  created_at: string;
  employees_count?: number;
}

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    manager_name: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/branches');
      setBranches(response.data.data);
    } catch (error) {
      console.error('خطا در دریافت شعبات:', error);
      notify.error('خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/branches', formData);
      notify.success('شعبه با موفقیت اضافه شد');
      setShowAddModal(false);
      setFormData({ code: '', name: '', address: '', phone: '', manager_name: '' });
      fetchBranches();
    } catch (error: any) {
      console.error('خطا در افزودن شعبه:', error);
      notify.error(error.response?.data?.message || 'خطا در افزودن شعبه');
    }
  };

  const handleEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/branches/${editingBranch?.id}`, formData);
      notify.success('شعبه با موفقیت ویرایش شد');
      setShowEditModal(false);
      setEditingBranch(null);
      fetchBranches();
    } catch (error: any) {
      console.error('خطا در ویرایش شعبه:', error);
      notify.error(error.response?.data?.message || 'خطا در ویرایش شعبه');
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!(await confirmDialog({ title: 'حذف شعبه', message: 'این شعبه برای همیشه حذف می‌شود و قابل بازگشت نیست.', confirmText: 'حذف', danger: true }))) return;
    try {
      await api.delete(`/branches/${id}`);
      notify.success('شعبه با موفقیت حذف شد');
      fetchBranches();
    } catch (error) {
      console.error('خطا در حذف شعبه:', error);
      notify.error('خطا در حذف شعبه');
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      manager_name: branch.manager_name
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
          { label: 'کل شعبات', value: branches.length, unit: 'شعبه', icon: Building2, tone: 'blue' },
          { label: 'شعبات فعال', value: branches.filter((b) => b.status === 'active').length, unit: 'شعبه', icon: CheckCircle, tone: 'emerald' },
          { label: 'شعبات غیرفعال', value: branches.filter((b) => b.status !== 'active').length, unit: 'شعبه', icon: XCircle, tone: 'red' },
          {
            label: 'کل کارمندان',
            value: branches.reduce((sum, b) => sum + Number(b.employees_count ?? 0), 0),
            unit: 'نفر',
            icon: Users,
            tone: 'amber',
          },
        ]}
      />

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="جستجوی شعبه..."
              className="w-full pr-10 pl-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary whitespace-nowrap justify-center px-5 py-3 text-sm md:text-base"
          >
            <Plus className="w-5 h-5" />
            افزودن شعبه جدید
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">کد شعبه</th>
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">نام شعبه</th>
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">آدرس</th>
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">تلفن</th>
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">مدیر</th>
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">وضعیت</th>
                <th className="text-right py-4 px-4 text-slate-700 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-mono text-slate-600">{branch.code}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-slate-800">{branch.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {branch.address}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4" />
                      {branch.phone}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4" />
                      {branch.manager_name}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      branch.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {branch.status === 'active' ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditModal(branch)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
