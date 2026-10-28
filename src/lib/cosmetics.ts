// ثابت‌های حوزه فروش لوازم آرایشی و بهداشتی

export const PRODUCT_CATEGORIES = [
  'مراقبت پوست',
  'پاکسازی پوست',
  'آرایش صورت',
  'آرایش چشم',
  'آرایش لب',
  'ناخن',
  'مراقبت مو',
  'حنا و رنگ مو',
  'عطر و ادکلن',
  'بهداشت شخصی',
  'لوازم مردانه',
  'لوازم جانبی آرایش',
];

export const PRODUCT_UNITS = ['دانه', 'بسته', 'شیشه', 'تیوب', 'قوطی', 'جوره', 'کارتن', 'درجن'];

export const CURRENCIES: Record<string, string> = {
  AFN: 'افغانی',
  USD: 'دالر',
  AED: 'درهم',
  PKR: 'کلدار',
  IRR: 'تومان/ریال',
  TRY: 'لیره ترکی',
  CNY: 'یوان',
};

export const CUSTOMER_TYPES: Record<string, string> = {
  retail: 'پرچون',
  wholesale: 'عمده (دوکاندار)',
  online: 'آنلاین (واتساپ/فیسبوک)',
};

export const SALE_PAYMENT_TYPES = ['نقدی', 'قرض', 'نیمه نقد - نیمه قرض', 'پول موبایلی (M-Paisa / HesabPay)', 'حواله'];
export const PURCHASE_PAYMENT_TYPES = ['نقدی', 'قرض', 'نیمه نقد - نیمه قرض', 'حواله'];

export const SALES_STATUS: Record<string, { label: string; className: string }> = {
  delivered: { label: 'تحویل داده شده', className: 'bg-emerald-100 text-emerald-700' },
  processing: { label: 'در حال ارسال', className: 'bg-blue-100 text-blue-700' },
  pending: { label: 'در انتظار', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'لغو شده', className: 'bg-slate-100 text-slate-600' },
  returned: { label: 'مرجوع شده', className: 'bg-red-100 text-red-700' },
};

export const PURCHASE_STATUS: Record<string, { label: string; className: string }> = {
  received: { label: 'تحویل گرفته شده', className: 'bg-emerald-100 text-emerald-700' },
  shipping: { label: 'در راه / گمرک', className: 'bg-blue-100 text-blue-700' },
  pending: { label: 'در انتظار', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'لغو شده', className: 'bg-slate-100 text-slate-600' },
};

export const statusOf = (map: Record<string, { label: string; className: string }>, status: string) =>
  map[status] || map.pending;

// هشدار انقضا از ۹۰ روز قبل (همان مقدار بک‌اند)
export const NEAR_EXPIRY_DAYS = 90;

export const daysUntil = (date?: string | null) => {
  if (!date) return null;
  const today = new Date(new Date().toDateString());
  return Math.round((new Date(date).getTime() - today.getTime()) / 86400000);
};

export const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('fa-AF') : '—';

export const today = () => new Date().toISOString().split('T')[0];
