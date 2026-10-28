# 🎯 از اینجا شروع کنید!

## ✅ وضعیت پروژه

- ✅ **Backend**: نصب شده و آماده
- ✅ **Frontend**: نصب شده و آماده
- ✅ **دیتابیس**: Schema و Seed آماده است
- ✅ **مستندات**: کامل

---

## 🚀 مراحل راه‌اندازی (5 دقیقه)

### مرحله 1: نصب و راه‌اندازی MySQL

#### نصب MySQL (اگر نصب نیست)
- **Windows**: [دانلود MySQL Installer](https://dev.mysql.com/downloads/installer/)
- **macOS**: `brew install mysql && brew services start mysql`
- **Linux**: `sudo apt install mysql-server`

#### ایجاد دیتابیس
```bash
# ورود به MySQL
mysql -u root -p

# ایجاد دیتابیس
CREATE DATABASE nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### اجرای Schema و Seed
```bash
# اجرای ساختار جداول
mysql -u root -p nowatic_management < database/schema.sql

# اجرای داده‌های اولیه
mysql -u root -p nowatic_management < database/seed.sql
```

---

### مرحله 2: تنظیم Backend

#### ایجاد فایل .env
```bash
cd backend
copy .env.example .env
```

#### ویرایش backend/.env
با یک ویرایشگر متن، فایل `backend/.env` را باز کنید و این مقادیر را تنظیم کنید:

```env
# اطلاعات MySQL خود را وارد کنید
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=nowatic_management
DB_PORT=3306

# تنظیمات سرور
PORT=5000
NODE_ENV=development

# یک رشته تصادفی برای JWT (می‌توانید همین را نگه دارید)
JWT_SECRET=nowatic_secret_key_2024_change_in_production_12345
JWT_EXPIRES_IN=7d

# آدرس Frontend
CORS_ORIGIN=http://localhost:5173
```

**⚠️ مهم**: `DB_PASSWORD` را با رمز عبور MySQL خود جایگزین کنید!

---

### مرحله 3: تنظیم Frontend

#### ایجاد فایل .env در ریشه پروژه
```bash
cd ..
echo VITE_API_URL=http://localhost:5000/api > .env
```

یا به صورت دستی فایل `.env` را در ریشه پروژه ایجاد کنید:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### مرحله 4: راه‌اندازی سیستم

#### روش 1: استفاده از اسکریپت (Windows)
```bash
start.bat
```

#### روش 2: راه‌اندازی دستی

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

باید این پیام را ببینید:
```
✅ اتصال به MySQL موفقیت‌آمیز بود
🚀 سرور نواتیک با موفقیت راه‌اندازی شد
📡 آدرس: http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

باید این پیام را ببینید:
```
VITE v5.4.2  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### مرحله 5: ورود به سیستم

1. مرورگر را باز کنید
2. به آدرس `http://localhost:5173` بروید
3. با یکی از حساب‌های زیر وارد شوید:

| نقش | ایمیل | رمز عبور |
|-----|-------|----------|
| **مدیر سیستم** | admin@nowatic.af | password123 |
| **مدیر** | manager@nowatic.af | password123 |
| **کارمند** | staff@nowatic.af | password123 |

---

## 🔧 عیب‌یابی

### مشکل 1: خطای اتصال به MySQL

**خطا**: `ER_ACCESS_DENIED_ERROR` یا `ECONNREFUSED`

**راه‌حل**:
```bash
# بررسی وضعیت MySQL
net start MySQL80

# تست اتصال
mysql -u root -p

# بررسی رمز عبور در backend/.env
```

### مشکل 2: خطای Port در حال استفاده

**خطا**: `EADDRINUSE: address already in use`

**راه‌حل**:
```bash
# Windows - کشتن پروسس روی port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# یا تغییر port در backend/.env
PORT=5001
```

### مشکل 3: خطای CORS

**خطا**: `CORS policy: No 'Access-Control-Allow-Origin'`

**راه‌حل**:
- مطمئن شوید Backend در حال اجرا است
- `CORS_ORIGIN` در `backend/.env` را بررسی کنید
- مرورگر را Refresh کنید

### مشکل 4: صفحه سفید یا خطای 404

**راه‌حل**:
```bash
# پاک کردن cache مرورگر
Ctrl + Shift + Delete

# یا
localStorage.clear()
```

---

## 📚 مستندات

- **[README.md](./README.md)** - مستندات کامل پروژه
- **[INSTALLATION.md](./INSTALLATION.md)** - راهنمای جزئیات نصب
- **[QUICK_START.md](./QUICK_START.md)** - نصب سریع
- **[SUMMARY.md](./SUMMARY.md)** - خلاصه پروژه

---

## 🧪 تست سیستم

### تست 1: Backend Health Check
```bash
curl http://localhost:5000/api/health
```

یا در مرورگر: http://localhost:5000/api/health

### تست 2: Login API
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@nowatic.af\",\"password\":\"password123\"}"
```

### تست 3: Frontend Login
1. باز کردن http://localhost:5173
2. ورود با admin@nowatic.af / password123
3. بررسی Dashboard
4. تست Logout

---

## 📊 ساختار پروژه

```
پروژه/
├── backend/              ← Backend API (Node.js + Express)
│   ├── config/          ← تنظیمات
│   ├── controllers/     ← کنترلرها
│   ├── middleware/      ← Middlewares
│   ├── routes/          ← مسیرها
│   └── server.js        ← نقطه ورود
│
├── database/            ← دیتابیس MySQL
│   ├── schema.sql       ← ساختار جداول
│   └── seed.sql         ← داده‌های اولیه
│
├── src/                 ← Frontend (React + TypeScript)
│   ├── components/      ← کامپوننت‌ها
│   ├── pages/           ← صفحات
│   ├── context/         ← Context API
│   └── lib/             ← کتابخانه‌ها
│
└── مستندات/
    ├── README.md
    ├── INSTALLATION.md
    ├── QUICK_START.md
    └── SUMMARY.md
```

---

## 🎯 مراحل بعدی

پس از راه‌اندازی موفق:

1. **آشنایی با سیستم**
   - بررسی Dashboard
   - تست صفحات مختلف
   - آزمایش Login/Logout

2. **توسعه**
   - اتصال صفحات به Backend
   - افزودن ویژگی‌های جدید
   - سفارشی‌سازی UI

3. **تست**
   - تست APIها
   - تست عملکرد
   - تست امنیت

---

## 💡 نکات مهم

- ✅ همیشه Backend را قبل از Frontend اجرا کنید
- ✅ رمز عبور MySQL را در `backend/.env` تنظیم کنید
- ✅ برای توقف سرورها، `Ctrl + C` را فشار دهید
- ✅ برای تغییرات در `.env`، سرور را Restart کنید
- ✅ از حساب Admin برای دسترسی کامل استفاده کنید

---

## 📞 کمک و پشتیبانی

اگر مشکلی داشتید:

1. **بررسی لاگ‌ها**
   - Terminal Backend را چک کنید
   - Console مرورگر را باز کنید (F12)

2. **بررسی تنظیمات**
   - فایل `backend/.env`
   - فایل `.env` در ریشه

3. **مطالعه مستندات**
   - [INSTALLATION.md](./INSTALLATION.md)
   - [SUMMARY.md](./SUMMARY.md)

---

## ✅ چک‌لیست راه‌اندازی

- [ ] MySQL نصب و راه‌اندازی شد
- [ ] دیتابیس `nowatic_management` ایجاد شد
- [ ] Schema اجرا شد (`database/schema.sql`)
- [ ] Seed اجرا شد (`database/seed.sql`)
- [ ] فایل `backend/.env` ایجاد و تنظیم شد
- [ ] Backend dependencies نصب شد
- [ ] فایل `.env` در ریشه ایجاد شد
- [ ] Frontend dependencies نصب شد
- [ ] Backend اجرا شد (http://localhost:5000)
- [ ] Frontend اجرا شد (http://localhost:5173)
- [ ] Login با موفقیت انجام شد

---

## 🎉 موفق باشید!

سیستم شما آماده است. برای شروع:

```bash
# Windows
start.bat

# یا به صورت دستی
cd backend && npm run dev
# در terminal جدید:
npm run dev
```

سپس مرورگر را باز کنید: **http://localhost:5173**

**ورود**: admin@nowatic.af / password123

---

**ساخته شده با ❤️ برای کسب‌وکارهای ایرانی و افغانی**
