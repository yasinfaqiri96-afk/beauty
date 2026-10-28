# 🚀 راهنمای نصب و راه‌اندازی سیستم مدیریت نواتیک

## پیش‌نیازها

قبل از شروع، مطمئن شوید که موارد زیر را نصب کرده‌اید:

- **Node.js** (نسخه 18 یا بالاتر) - [دانلود](https://nodejs.org/)
- **MySQL** (نسخه 8.0 یا بالاتر) - [دانلود](https://dev.mysql.com/downloads/mysql/)
- **Git** - [دانلود](https://git-scm.com/)

---

## مرحله 1: نصب MySQL و ایجاد دیتابیس

### 1.1 نصب MySQL

#### Windows:
1. فایل نصب MySQL را از [اینجا](https://dev.mysql.com/downloads/installer/) دانلود کنید
2. نصب را انجام دهید و رمز عبور root را تنظیم کنید
3. MySQL Workbench را نیز نصب کنید

#### macOS (با Homebrew):
```bash
brew install mysql
brew services start mysql
mysql_secure_installation
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

### 1.2 ایجاد دیتابیس

1. وارد MySQL شوید:
```bash
mysql -u root -p
```

2. دیتابیس را ایجاد کنید:
```sql
CREATE DATABASE nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. کاربر جدید ایجاد کنید (اختیاری):
```sql
CREATE USER 'nowatic_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON nowatic_management.* TO 'nowatic_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.3 اجرای Schema

```bash
mysql -u root -p nowatic_management < database/schema.sql
```

### 1.4 اجرای داده‌های اولیه

```bash
mysql -u root -p nowatic_management < database/seed.sql
```

---

## مرحله 2: نصب Backend

### 2.1 رفتن به پوشه backend

```bash
cd backend
```

### 2.2 نصب وابستگی‌ها

```bash
npm install
```

### 2.3 تنظیم متغیرهای محیطی

1. کپی کردن فایل `.env.example`:
```bash
copy .env.example .env
```

2. ویرایش فایل `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nowatic_management
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (یک رشته تصادفی و امن)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 2.4 راه‌اندازی سرور

```bash
npm run dev
```

اگر همه چیز درست باشد، باید این پیام را ببینید:
```
✅ اتصال به MySQL موفقیت‌آمیز بود
🚀 سرور نواتیک با موفقیت راه‌اندازی شد
📡 آدرس: http://localhost:5000
```

---

## مرحله 3: نصب Frontend

### 3.1 بازگشت به پوشه اصلی و نصب وابستگی‌ها

```bash
cd ..
npm install
```

### 3.2 تنظیم متغیرهای محیطی

1. ایجاد فایل `.env` در ریشه پروژه:
```bash
echo VITE_API_URL=http://localhost:5000/api > .env
```

یا به صورت دستی فایل `.env` را ایجاد کنید:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3.3 راه‌اندازی Frontend

```bash
npm run dev
```

Frontend روی آدرس `http://localhost:5173` اجرا می‌شود.

---

## مرحله 4: تست سیستم

### 4.1 ورود به سیستم

1. مرورگر را باز کنید و به `http://localhost:5173` بروید
2. با یکی از حساب‌های زیر وارد شوید:

**Admin:**
- ایمیل: `admin@nowatic.af`
- رمز عبور: `password123`

**Manager:**
- ایمیل: `manager@nowatic.af`
- رمز عبور: `password123`

**Staff:**
- ایمیل: `staff@nowatic.af`
- رمز عبور: `password123`

### 4.2 تست APIها

با Postman یا curl می‌توانید APIها را تست کنید:

```bash
# Health Check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nowatic.af","password":"password123"}'

# Get Products (با token)
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## مرحله 5: Build برای Production

### 5.1 Build Frontend

```bash
npm run build
```

فایل‌های build شده در پوشه `dist` قرار می‌گیرند.

### 5.2 اجرای Backend در Production

```bash
cd backend
npm start
```

---

## عیب‌یابی مشکلات رایج

### مشکل 1: خطای اتصال به MySQL

**خطا:** `ER_ACCESS_DENIED_ERROR` یا `ECONNREFUSED`

**راه‌حل:**
1. مطمئن شوید MySQL در حال اجرا است:
```bash
# Windows
net start MySQL80

# macOS/Linux
sudo systemctl start mysql
```

2. اطلاعات اتصال در `.env` را بررسی کنید
3. رمز عبور MySQL را تست کنید:
```bash
mysql -u root -p
```

### مشکل 2: خطای Port در حال استفاده

**خطا:** `EADDRINUSE: address already in use`

**راه‌حل:**
1. پورت دیگری در `.env` تنظیم کنید
2. یا پروسس قبلی را ببندید:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### مشکل 3: خطای CORS

**خطا:** `CORS policy: No 'Access-Control-Allow-Origin'`

**راه‌حل:**
مطمئن شوید `CORS_ORIGIN` در `backend/.env` درست تنظیم شده:
```env
CORS_ORIGIN=http://localhost:5173
```

### مشکل 4: خطای JWT

**خطا:** `jwt malformed` یا `invalid token`

**راه‌حل:**
1. از localStorage پاک کنید:
```javascript
localStorage.clear()
```
2. دوباره login کنید

---

## دستورات مفید

```bash
# Backend
cd backend
npm run dev          # اجرای development
npm start            # اجرای production
npm install          # نصب وابستگی‌ها

# Frontend
npm run dev          # اجرای development
npm run build        # build برای production
npm run preview      # پیش‌نمایش build

# Database
mysql -u root -p nowatic_management < database/schema.sql    # اجرای schema
mysql -u root -p nowatic_management < database/seed.sql      # اجرای seed data
```

---

## پورت‌های پیش‌فرض

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **MySQL:** localhost:3306

---

## پشتیبانی

اگر مشکلی داشتید:
1. لاگ‌های console را بررسی کنید
2. فایل `.env` را چک کنید
3. مطمئن شوید MySQL در حال اجرا است
4. مطمئن شوید تمام وابستگی‌ها نصب شده‌اند

---

## ✅ چک‌لیست نصب

- [ ] MySQL نصب و راه‌اندازی شد
- [ ] دیتابیس `nowatic_management` ایجاد شد
- [ ] Schema و Seed اجرا شدند
- [ ] Backend dependencies نصب شدند
- [ ] فایل `backend/.env` تنظیم شد
- [ ] Backend سرور اجرا شد (port 5000)
- [ ] Frontend dependencies نصب شدند
- [ ] فایل `.env` در ریشه تنظیم شد
- [ ] Frontend اجرا شد (port 5173)
- [ ] Login با موفقیت انجام شد

---

🎉 **تبریک! سیستم شما آماده است!**
