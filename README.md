# 🌾 سیستم مدیریت نواتیک

یک سیستم مدیریت جامع (ERP) برای کسب‌وکارهای تجاری با تمرکز بر مدیریت محصولات کشاورزی، فروش، خرید، انبار و مشتریان.

![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)

---

## ✨ ویژگی‌ها

### 📊 داشبورد جامع
- نمایش آمار زنده فروش، موجودی، سفارشات و مشتریان
- نمودارهای تحلیلی و گزارشات
- هشدارهای موجودی کم
- وضعیت مالی (طلب، بدهی، خالص)

### 📦 مدیریت محصولات
- ثبت و ویرایش محصولات
- مدیریت موجودی انبار
- ردیابی قیمت خرید و فروش
- هشدار موجودی کم

### 💰 مدیریت فروش
- ثبت سفارشات فروش
- مدیریت فاکتورها
- پیگیری وضعیت پرداخت
- گزارشات فروش

### 🛒 مدیریت خرید
- ثبت سفارشات خرید
- مدیریت تامین‌کنندگان
- پیگیری بدهی‌ها
- گزارشات خرید

### 👥 مدیریت مشتریان
- پروفایل کامل مشتریان
- تاریخچه خرید
- مدیریت طلب و بدهی
- آمار مشتریان

### 🏢 مدیریت شعبات
- مدیریت چند شعبه
- تخصیص کاربران به شعبات
- گزارشات تفکیک شده

### 📈 گزارشات پیشرفته
- گزارشات مالی
- گزارشات موجودی
- گزارشات فروش و خرید
- خروجی Excel

### 🔐 احراز هویت و امنیت
- سیستم Login/Logout
- مدیریت نقش‌های کاربری (Admin, Manager, Staff)
- JWT Authentication
- Protected Routes

---

## 🛠️ تکنولوژی‌ها

### Frontend
- **React 18.3.1** - کتابخانه UI
- **TypeScript 5.5.3** - Type Safety
- **Vite 5.4.2** - Build Tool
- **React Router DOM 6.14.1** - Routing
- **Tailwind CSS 3.4.1** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP Client

### Backend
- **Node.js** - Runtime
- **Express 4.18** - Web Framework
- **MySQL 8.0+** - Database
- **JWT** - Authentication
- **Bcrypt** - Password Hashing
- **Helmet** - Security
- **CORS** - Cross-Origin Resource Sharing

---

## 📁 ساختار پروژه

```
nowatic-management/
├── backend/                    # Backend API
│   ├── config/                # تنظیمات
│   │   └── database.js       # اتصال MySQL
│   ├── controllers/          # کنترلرها
│   │   ├── authController.js
│   │   ├── productsController.js
│   │   ├── customersController.js
│   │   └── salesController.js
│   ├── middleware/           # Middlewares
│   │   └── auth.js          # احراز هویت
│   ├── routes/              # مسیرها
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── customers.js
│   │   └── sales.js
│   ├── .env.example         # نمونه متغیرهای محیطی
│   ├── package.json
│   └── server.js            # نقطه ورود
│
├── database/                 # دیتابیس
│   ├── schema.sql           # ساختار جداول
│   └── seed.sql             # داده‌های اولیه
│
├── src/                      # Frontend
│   ├── components/          # کامپوننت‌ها
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   ├── pages/               # صفحات
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Products.tsx
│   │   ├── Sales.tsx
│   │   ├── Purchase.tsx
│   │   ├── Customers.tsx
│   │   ├── Suppliers.tsx
│   │   ├── Warehouse.tsx
│   │   ├── Branches.tsx
│   │   └── Reports.tsx
│   ├── context/             # Context API
│   │   └── AuthContext.tsx
│   ├── lib/                 # کتابخانه‌ها
│   │   └── api.ts          # API Client
│   ├── App.tsx
│   └── main.tsx
│
├── INSTALLATION.md          # راهنمای نصب
└── README.md               # این فایل
```

---

## 🚀 نصب و راه‌اندازی

### نصب سریع

```bash
# 1. کلون کردن پروژه
git clone <repository-url>
cd nowatic-management

# 2. نصب MySQL و ایجاد دیتابیس
mysql -u root -p
CREATE DATABASE nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 3. اجرای Schema و Seed
mysql -u root -p nowatic_management < database/schema.sql
mysql -u root -p nowatic_management < database/seed.sql

# 4. نصب و راه‌اندازی Backend
cd backend
npm install
copy .env.example .env
# ویرایش .env و تنظیم اطلاعات MySQL
npm run dev

# 5. نصب و راه‌اندازی Frontend (در terminal جدید)
cd ..
npm install
echo VITE_API_URL=http://localhost:5000/api > .env
npm run dev
```

### راهنمای کامل نصب

برای راهنمای کامل و جزئیات بیشتر، فایل [INSTALLATION.md](./INSTALLATION.md) را مطالعه کنید.

---

## 🔑 حساب‌های آزمایشی

پس از نصب، می‌توانید با این حساب‌ها وارد شوید:

| نقش | ایمیل | رمز عبور |
|-----|-------|----------|
| Admin | admin@nowatic.af | password123 |
| Manager | manager@nowatic.af | password123 |
| Staff | staff@nowatic.af | password123 |

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    # ثبت نام
POST   /api/auth/login       # ورود
GET    /api/auth/me          # اطلاعات کاربر فعلی
```

### Products
```
GET    /api/products              # لیست محصولات
GET    /api/products/:id          # جزئیات محصول
POST   /api/products              # ایجاد محصول
PUT    /api/products/:id          # ویرایش محصول
DELETE /api/products/:id          # حذف محصول
GET    /api/products/low-stock    # محصولات با موجودی کم
```

### Customers
```
GET    /api/customers         # لیست مشتریان
GET    /api/customers/:id     # جزئیات مشتری
POST   /api/customers         # ایجاد مشتری
PUT    /api/customers/:id     # ویرایش مشتری
DELETE /api/customers/:id     # حذف مشتری
```

### Sales
```
GET    /api/sales             # لیست فروش
GET    /api/sales/:id         # جزئیات فروش
POST   /api/sales             # ثبت فروش
PATCH  /api/sales/:id/status  # بروزرسانی وضعیت
GET    /api/sales/stats       # آمار فروش
```

---

## 🎨 اسکرین‌شات‌ها

### صفحه ورود
![Login Page](./screenshots/login.png)

### داشبورد
![Dashboard](./screenshots/dashboard.png)

### مدیریت محصولات
![Products](./screenshots/products.png)

---

## 🔒 امنیت

- ✅ JWT Authentication
- ✅ Password Hashing با Bcrypt
- ✅ Role-Based Access Control (RBAC)
- ✅ Protected API Routes
- ✅ CORS Configuration
- ✅ Helmet Security Headers
- ✅ SQL Injection Prevention
- ✅ XSS Protection

---

## 🌐 پشتیبانی از RTL

سیستم کاملاً از زبان‌های راست به چپ (فارسی/دری) پشتیبانی می‌کند:
- ✅ UI کاملاً RTL
- ✅ فونت Vazir
- ✅ تمام متون به فارسی/دری
- ✅ تاریخ شمسی

---

## 📱 Responsive Design

- ✅ موبایل (< 768px)
- ✅ تبلت (768px - 1024px)
- ✅ دسکتاپ (> 1024px)

---

## 🧪 تست

```bash
# Backend Tests
cd backend
npm test

# Frontend Tests
npm test
```

---

## 📦 Build برای Production

```bash
# Frontend Build
npm run build

# Backend Production
cd backend
npm start
```

---

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/AmazingFeature`)
3. تغییرات را Commit کنید (`git commit -m 'Add some AmazingFeature'`)
4. Push کنید (`git push origin feature/AmazingFeature`)
5. Pull Request باز کنید

---

## 📝 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

---

## 👨‍💻 توسعه‌دهنده

ساخته شده با ❤️ برای کسب‌وکارهای ایرانی و افغانی

---

## 📞 پشتیبانی

اگر سوالی دارید یا به کمک نیاز دارید:
- 📧 Email: support@nowatic.af
- 📱 Telegram: @nowatic_support
- 🌐 Website: https://nowatic.af

---

## 🗺️ Roadmap

- [ ] پشتیبانی از چند زبان (فارسی، دری، انگلیسی)
- [ ] اپلیکیشن موبایل (React Native)
- [ ] گزارشات پیشرفته‌تر با نمودارها
- [ ] یکپارچه‌سازی با سیستم‌های حسابداری
- [ ] پشتیبانی از چند ارز
- [ ] سیستم پیامک و ایمیل
- [ ] بارکد و QR Code
- [ ] پرینت فاکتور و برچسب

---

**⭐ اگر این پروژه برای شما مفید بود، لطفاً یک ستاره بدهید!**
