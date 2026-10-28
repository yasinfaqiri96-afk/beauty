@echo off
chcp 65001 >nul
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║   🚀 راه‌اندازی سیستم مدیریت نواتیک                  ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo [1/2] راه‌اندازی Backend...
start "Nowatic Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 >nul

echo [2/2] راه‌اندازی Frontend...
start "Nowatic Frontend" cmd /k "npm run dev"
timeout /t 3 >nul

echo.
echo ✅ سیستم در حال راه‌اندازی است...
echo.
echo 📡 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo.
echo برای توقف، پنجره‌های Terminal را ببندید
echo.
pause
