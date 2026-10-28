@echo off
echo Building project for production...
call npm run build

echo.
echo Build completed successfully!
echo.
echo Files are ready in 'dist' folder for upload to hosting.
echo.
echo Next steps:
echo 1. Upload all files from 'dist' folder to your hosting public_html
echo 2. Make sure .htaccess file is uploaded
echo 3. Check if your hosting supports Node.js (not required for this build)
echo.
pause