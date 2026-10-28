@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   🗄️  راه‌اندازی دیتابیس MySQL                       ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo [1/3] ایجاد دیتابیس...
mysql -u root -e "CREATE DATABASE IF NOT EXISTS nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if errorlevel 1 (
    echo ❌ خطا در ایجاد دیتابیس
    echo.
    echo لطفاً مطمئن شوید:
    echo 1. MySQL نصب و در حال اجرا است
    echo 2. رمز عبور root خالی است یا رمز عبور را وارد کنید
    echo.
    echo برای وارد کردن رمز عبور، دستور زیر را اجرا کنید:
    echo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    pause
    exit /b 1
)
echo ✅ دیتابیس ایجاد شد

echo.
echo [2/3] اجرای Schema...
mysql -u root nowatic_management < database\schema.sql
if errorlevel 1 (
    echo ❌ خطا در اجرای Schema
    pause
    exit /b 1
)
echo ✅ Schema اجرا شد

echo.
echo [3/3] اجرای Seed Data...
mysql -u root nowatic_management < database\seed.sql
if errorlevel 1 (
    echo ❌ خطا در اجرای Seed Data
    pause
    exit /b 1
)
echo ✅ Seed Data اجرا شد

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   ✅ دیتابیس با موفقیت راه‌اندازی شد!                ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo حساب‌های آزمایشی:
echo   Admin: admin@nowatic.af / password123
echo   Manager: manager@nowatic.af / password123
echo   Staff: staff@nowatic.af / password123
echo.
pause
