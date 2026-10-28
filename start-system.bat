@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   🚀 راه‌اندازی سیستم مدیریت نواتیک                  ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo 📡 در حال راه‌اندازی بک‌اند...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul

echo 🌐 در حال راه‌اندازی فرانت‌اند...
start "Frontend Server" cmd /k "npm run dev"
timeout /t 3 >nul

echo.
echo ✅ سیستم با موفقیت راه‌اندازی شد!
echo.
echo 📍 آدرس‌های دسترسی:
echo    - فرانت‌اند: http://localhost:5173/anbar/
echo    - بک‌اند: http://localhost:5000
echo.
echo 👤 اطلاعات ورود:
echo    - ایمیل: admin@nowatic.af
echo    - رمز عبور: password123
echo.
echo 💡 برای بستن سرورها، پنجره‌های باز شده را ببندید
echo.
pause
