# 🗄️ راه‌اندازی دیتابیس MySQL

## روش 1: با MySQL Command Line

### گام 1: باز کردن MySQL Command Line
1. Start Menu را باز کنید
2. "MySQL Command Line Client" را جستجو کنید
3. آن را باز کنید و رمز عبور root را وارد کنید

### گام 2: اجرای دستورات
```sql
-- ایجاد دیتابیس
CREATE DATABASE IF NOT EXISTS nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- استفاده از دیتابیس
USE nowatic_management;

-- خروج
EXIT;
```

### گام 3: اجرای Schema
در Command Prompt یا PowerShell:
```bash
# اگر MySQL در PATH است:
mysql -u root -p nowatic_management < database\schema.sql

# اگر نیست، مسیر کامل را استفاده کنید:
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p nowatic_management < database\schema.sql
```

### گام 4: اجرای Seed Data
```bash
mysql -u root -p nowatic_management < database\seed.sql
```

---

## روش 2: با MySQL Workbench (آسان‌تر)

### گام 1: باز کردن MySQL Workbench
1. MySQL Workbench را باز کنید
2. به Local instance متصل شوید

### گام 2: ایجاد دیتابیس
1. File → Open SQL Script
2. فایل `database/create-database.sql` را باز کنید
3. دکمه Execute (⚡) را بکلیک کنید

### گام 3: اجرای Schema
1. File → Open SQL Script
2. فایل `database/schema.sql` را باز کنید
3. دکمه Execute (⚡) را بکلیک کنید

### گام 4: اجرای Seed Data
1. File → Open SQL Script
2. فایل `database/seed.sql` را باز کنید
3. دکمه Execute (⚡) را بکلیک کنید

---

## روش 3: با phpMyAdmin

### گام 1: باز کردن phpMyAdmin
معمولاً در: http://localhost/phpmyadmin

### گام 2: ایجاد دیتابیس
1. تب "Databases" را کلیک کنید
2. نام دیتابیس: `nowatic_management`
3. Collation: `utf8mb4_unicode_ci`
4. دکمه "Create" را بکلیک کنید

### گام 3: Import Schema
1. دیتابیس `nowatic_management` را انتخاب کنید
2. تب "Import" را کلیک کنید
3. فایل `database/schema.sql` را انتخاب کنید
4. دکمه "Go" را بکلیک کنید

### گام 4: Import Seed Data
1. تب "Import" را دوباره کلیک کنید
2. فایل `database/seed.sql` را انتخاب کنید
3. دکمه "Go" را بکلیک کنید

---

## تست اتصال

پس از راه‌اندازی دیتابیس، Backend را Restart کنید:

```bash
cd backend
npm run dev
```

باید این پیام را ببینید:
```
✅ اتصال به MySQL موفقیت‌آمیز بود
🚀 سرور نواتیک با موفقیت راه‌اندازی شد
```

---

## عیب‌یابی

### خطا: Access denied for user 'root'
**راه‌حل**: رمز عبور در `backend/.env` را تنظیم کنید:
```env
DB_PASSWORD=your_mysql_password
```

### خطا: Unknown database 'nowatic_management'
**راه‌حل**: دیتابیس را ایجاد کنید (روش‌های بالا)

### خطا: mysql command not found
**راه‌حل**: 
1. MySQL را به PATH اضافه کنید
2. یا از MySQL Workbench استفاده کنید
3. یا مسیر کامل را استفاده کنید:
```bash
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

---

## بررسی موفقیت

برای بررسی اینکه دیتابیس درست ایجاد شده:

```sql
USE nowatic_management;
SHOW TABLES;
```

باید 12 جدول ببینید:
- users
- branches
- products
- customers
- suppliers
- sales_orders
- sales_order_items
- purchase_orders
- purchase_order_items
- warehouse_stock
- payments
- inventory_transactions

---

## حساب‌های آزمایشی

پس از اجرای Seed Data، این حساب‌ها آماده هستند:

| نقش | ایمیل | رمز عبور |
|-----|-------|----------|
| Admin | admin@nowatic.af | password123 |
| Manager | manager@nowatic.af | password123 |
| Staff | staff@nowatic.af | password123 |

---

**✅ پس از راه‌اندازی موفق دیتابیس، به [START_HERE.md](./START_HERE.md) برگردید**
