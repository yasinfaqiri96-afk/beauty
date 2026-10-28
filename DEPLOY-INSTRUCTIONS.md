# دستورالعمل آپلود سیستم در هاست اشتراکی

## مراحل آماده‌سازی و آپلود

### 1. ساخت فایل‌های نهایی
```bash
npm run build
```

### 2. فایل‌های آپلود
پس از اجرای دستور build، پوشه `dist` ایجاد می‌شود. محتویات این پوشه را آپلود کنید:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
├── logo.png
└── .htaccess
```

### 3. آپلود به هاست
1. به cPanel یا FTP هاست خود متصل شوید
2. به مسیر `public_html` بروید
3. پوشه جدیدی به نام `anbar` ایجاد کنید
4. تمام محتویات پوشه `dist` را داخل `public_html/anbar/` آپلود کنید

### 4. ساختار نهایی در هاست
```
public_html/
└── anbar/
    ├── index.html
    ├── assets/
    ├── logo.png
    └── .htaccess
```

### 5. دسترسی به سیستم
پس از آپلود، سیستم در آدرس زیر قابل دسترسی است:
```
https://novatechsoft.com/anbar
```

## نکات مهم
- فایل `.htaccess` برای routing صحیح React Router ضروری است
- اگر فایل `.htaccess` آپلود نشد، از File Manager در cPanel استفاده کنید
- مطمئن شوید که "Show Hidden Files" در File Manager فعال باشد
- اگر خطای 404 دریافت کردید، محتوای `.htaccess` را بررسی کنید
