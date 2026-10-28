@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   🚀 نصب خودکار سیستم مدیریت نواتیک                  ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo [1/6] بررسی Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js نصب نیست! لطفاً از https://nodejs.org دانلود کنید
    pause
    exit /b 1
)
echo ✅ Node.js نصب شده است

echo.
echo [2/6] بررسی MySQL...
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MySQL یافت نشد! لطفاً MySQL را نصب کنید
    echo    دانلود: https://dev.mysql.com/downloads/installer/
    pause
    exit /b 1
)
echo ✅ MySQL نصب شده است

echo.
echo [3/6] نصب وابستگی‌های Backend...
cd backend
if not exist node_modules (
    call npm install
    if errorlevel 1 (
        echo ❌ خطا در نصب وابستگی‌های Backend
        pause
        exit /b 1
    )
)
echo ✅ وابستگی‌های Backend نصب شد

echo.
echo [4/6] تنظیم فایل .env برای Backend...
if not exist .env (
    copy .env.example .env
    echo ⚠️  لطفاً فایل backend\.env را ویرایش کنید و اطلاعات MySQL را وارد کنید
    echo    سپس این اسکریپت را دوباره اجرا کنید
    pause
    exit /b 0
)
echo ✅ فایل .env موجود است

cd ..

echo.
echo [5/6] نصب وابستگی‌های Frontend...
if not exist node_modules (
    call npm install
    if errorlevel 1 (
        echo ❌ خطا در نصب وابستگی‌های Frontend
        pause
        exit /b 1
    )
)
echo ✅ وابستگی‌های Frontend نصب شد

echo.
echo [6/6] تنظیم فایل .env برای Frontend...
if not exist .env (
    echo VITE_API_URL=http://localhost:5000/api > .env
)
echo ✅ فایل .env ایجاد شد

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   ✅ نصب با موفقیت انجام شد!                         ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo مراحل بعدی:
echo.
echo 1. دیتابیس MySQL را ایجاد کنید:
echo    mysql -u root -p
echo    CREATE DATABASE nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo    EXIT;
echo.
echo 2. Schema و Seed را اجرا کنید:
echo    mysql -u root -p nowatic_management ^< database\schema.sql
echo    mysql -u root -p nowatic_management ^< database\seed.sql
echo.
echo 3. Backend را اجرا کنید:
echo    cd backend
echo    npm run dev
echo.
echo 4. Frontend را اجرا کنید (در terminal جدید):
echo    npm run dev
echo.
echo 5. مرورگر را باز کنید:
echo    http://localhost:5173
echo.
echo حساب‌های آزمایشی:
echo    Admin: admin@nowatic.af / password123
echo    Manager: manager@nowatic.af / password123
echo    Staff: staff@nowatic.af / password123
echo.
pause
