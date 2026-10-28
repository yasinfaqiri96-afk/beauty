# تنظیمات عرض صفحه و Layout

## ✅ تغییرات اعمال شده

### 1. حذف محدودیت عرض
- **قبل**: محتوا محدود به `max-w-7xl` (1280px) بود
- **بعد**: محتوا از تمام عرض صفحه استفاده می‌کند

### 2. تنظیمات جدید Layout

#### Main Content Area
```tsx
// src/components/Layout.tsx
<main className="px-4 sm:px-6 lg:px-8 py-6 md:py-8">
  <div className="relative w-full">
    {children}
  </div>
</main>
```

#### CSS Classes جدید
```css
/* عرض کامل بدون محدودیت */
.container-responsive {
  @apply w-full mx-auto px-4 sm:px-6 lg:px-8;
}

/* عرض خیلی بزرگ با حداکثر 1920px */
.container-wide {
  @apply w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-[1920px];
}

/* عرض استاندارد (قبلی) */
.container-standard {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}
```

## 📐 عرض‌های مختلف Sidebar

### Desktop
- **Expanded**: 288px (w-72)
- **Collapsed**: 80px (w-20)

### فضای محتوا
- با Sidebar باز: `md:mr-72` (288px margin)
- با Sidebar بسته: `md:mr-24` (96px margin)

## 🎨 Responsive Breakpoints

```css
/* Mobile */
< 768px: padding 16px (px-4)

/* Tablet */
768px - 1024px: padding 24px (sm:px-6)

/* Desktop */
> 1024px: padding 32px (lg:px-8)
```

## 💡 نکات مهم

### 1. استفاده از عرض کامل در صفحات
اگر می‌خواهید یک صفحه خاص از عرض کامل استفاده کند:
```tsx
<div className="w-full">
  {/* محتوای شما */}
</div>
```

### 2. محدود کردن عرض در صفحات خاص
اگر می‌خواهید یک صفحه خاص عرض محدود داشته باشد:
```tsx
<div className="max-w-7xl mx-auto">
  {/* محتوای شما */}
</div>
```

### 3. Grid Layouts
برای استفاده بهینه از فضا در Grid:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* کارت‌ها */}
</div>
```

## 🔧 تنظیمات پیشرفته

### تغییر Padding صفحه
در `src/components/Layout.tsx`:
```tsx
// کم کردن padding
<main className="px-2 sm:px-4 lg:px-6">

// زیاد کردن padding
<main className="px-6 sm:px-8 lg:px-12">
```

### تغییر عرض Sidebar
در `src/components/Sidebar.tsx`:
```tsx
// Sidebar بزرگتر
<aside className={`... ${isCollapsed ? 'w-24' : 'w-80 lg:w-96'}`}>

// Sidebar کوچکتر
<aside className={`... ${isCollapsed ? 'w-16' : 'w-56 lg:w-64'}`}>
```

## 📱 Mobile Optimization

### Sidebar در موبایل
- عرض ثابت: 320px (w-80)
- حالت Drawer با overlay
- بسته شدن خودکار بعد از کلیک

### محتوا در موبایل
- Padding کمتر: 16px
- Stack layout برای کارت‌ها
- جداول تبدیل به کارت می‌شوند

## 🎯 بهترین روش‌ها

1. **Dashboard**: از Grid با 4 ستون استفاده کنید
2. **جداول**: از عرض کامل استفاده کنید
3. **فرم‌ها**: محدود به max-w-2xl یا max-w-4xl
4. **کارت‌های محصول**: Grid با 3-4 ستون

## 🔄 تغییرات Real-time

تمام تغییرات به صورت خودکار با Vite HMR اعمال می‌شوند:
- تغییر CSS: بدون refresh
- تغییر Component: بدون refresh
- حفظ state در حین تغییرات

## ✅ نتیجه

✅ عرض صفحه حالا از تمام فضای موجود استفاده می‌کند
✅ Responsive در تمام سایزها
✅ Sidebar قابل جمع شدن برای فضای بیشتر
✅ Padding مناسب در تمام breakpoint ها
