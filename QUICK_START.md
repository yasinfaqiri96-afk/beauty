# ⚡ راهنمای سریع - نصب در 5 دقیقه

## پیش‌نیاز
- Node.js 18+
- MySQL 8.0+

## مراحل نصب

### 1️⃣ نصب MySQL و ایجاد دیتابیس (2 دقیقه)

```bash
# ورود به MySQL
mysql -u root -p

# ایجاد دیتابیس
CREATE DATABASE nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# اجرای Schema
mysql -u root -p nowatic_management < database/schema.sql

# اجرای داده‌های اولیه
mysql -u root -p nowatic_management < database/seed.sql
```

### 2️⃣ نصب Backend (1 دقیقه)

```bash
cd backend
npm install
copy .env.example .env
```

**ویرایش `backend/.env`:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=nowatic_management
DB_PORT=3306
PORT=5000
JWT_SECRET=your_secret_key_12345
CORS_ORIGIN=http://localhost:5173
```

### 3️⃣ نصب Frontend (1 دقیقه)

```bash
cd ..
npm install
echo VITE_API_URL=http://localhost:5000/api > .env
```

### 4️⃣ راه‌اندازی (1 دقیقه)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5️⃣ ورود به سیستم

مرورگر را باز کنید: **http://localhost:5173**

**حساب‌های آزمایشی:**
- Admin: `admin@nowatic.af` / `password123`
- Manager: `manager@nowatic.af` / `password123`
- Staff: `staff@nowatic.af` / `password123`

---

## 🚀 نصب خودکار (Windows)

```bash
# اجرای اسکریپت نصب
install.bat

# راه‌اندازی سیستم
start.bat
```

---

## ✅ چک‌لیست

- [ ] MySQL نصب شد
- [ ] دیتابیس ایجاد شد
- [ ] Schema اجرا شد
- [ ] Seed اجرا شد
- [ ] Backend `.env` تنظیم شد
- [ ] Backend dependencies نصب شد
- [ ] Frontend `.env` تنظیم شد
- [ ] Frontend dependencies نصب شد
- [ ] Backend اجرا شد (port 5000)
- [ ] Frontend اجرا شد (port 5173)
- [ ] Login موفق بود

---

## 🔧 عیب‌یابی سریع

### خطای اتصال MySQL
```bash
# بررسی وضعیت MySQL
net start MySQL80

# تست اتصال
mysql -u root -p
```

### خطای Port
```bash
# تغییر port در backend/.env
PORT=5001

# تغییر port در .env
VITE_API_URL=http://localhost:5001/api
```

### پاک کردن و نصب مجدد
```bash
# Backend
cd backend
rmdir /s /q node_modules
npm install

# Frontend
cd ..
rmdir /s /q node_modules
npm install
```

---

## 📞 کمک

اگر مشکلی داشتید، فایل [INSTALLATION.md](./INSTALLATION.md) را مطالعه کنید.

---

**🎉 موفق باشید!**
