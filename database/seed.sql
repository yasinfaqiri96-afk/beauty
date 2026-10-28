-- ==========================================
-- داده‌های اولیه - فروشگاه لوازم آرایشی و بهداشتی
-- قیمت‌ها نمونه و به افغانی هستند؛ پیش از استفاده واقعی با نرخ روز بازار اصلاح شوند
-- ==========================================

USE nowatic_management;

-- ==========================================
-- 1. شعبات
-- ==========================================
INSERT INTO branches (id, code, name, address, phone, manager_name, status) VALUES
(UUID(), 'BR-001', 'فروشگاه مرکزی کابل', 'کابل، شهر نو، سرک چهارراهی انصاری', '0799123456', 'احمد رضایی', 'active'),
(UUID(), 'BR-002', 'شعبه هرات', 'هرات، چوک گلها', '0799234567', 'محمد کریمی', 'active'),
(UUID(), 'BR-003', 'شعبه مزار شریف', 'مزار شریف، سرک بلخ', '0799345678', 'علی احمدی', 'active');

-- ==========================================
-- 2. کاربران (رمز عبور: password123)
-- ==========================================
INSERT INTO users (id, email, password_hash, full_name, phone, role, branch_id, status) VALUES
(UUID(), 'admin@nowatic.af', '$2a$10$/UNjnOZoiENZBQDfuGybNOijftpl1GZKjX9PvwVgp/dJtr9utJcW6', 'علی رضایی', '0799111222', 'admin', (SELECT id FROM branches WHERE code = 'BR-001'), 'active'),
(UUID(), 'manager@nowatic.af', '$2a$10$/UNjnOZoiENZBQDfuGybNOijftpl1GZKjX9PvwVgp/dJtr9utJcW6', 'محمد احمدی', '0799222333', 'manager', (SELECT id FROM branches WHERE code = 'BR-001'), 'active'),
(UUID(), 'staff@nowatic.af', '$2a$10$/UNjnOZoiENZBQDfuGybNOijftpl1GZKjX9PvwVgp/dJtr9utJcW6', 'حسین کریمی', '0799333444', 'staff', (SELECT id FROM branches WHERE code = 'BR-001'), 'active');

-- ==========================================
-- 3. محصولات (قیمت خرید = قیمت تمام‌شده یک دانه، فروش = پرچون، عمده = برای دوکانداران)
-- ==========================================
INSERT INTO products (id, sku, barcode, name, brand, category, origin, purchase_price, sale_price, wholesale_price, stock_quantity, min_stock_quantity, unit, track_expiry, status) VALUES
(UUID(), 'SKN-001', '4005900036735', 'کرم نیوآ سافت ۲۰۰ ملی‌لیتر', 'Nivea', 'مراقبت پوست', 'آلمان', 210.00, 280.00, 245.00, 0, 24, 'دانه', 1, 'active'),
(UUID(), 'SKN-002', '8901030865527', 'کرم گلو اند لاولی ۵۰ گرم', 'Glow & Lovely', 'مراقبت پوست', 'پاکستان', 75.00, 110.00, 90.00, 0, 48, 'دانه', 1, 'active'),
(UUID(), 'SKN-003', '6260111840012', 'کرم ضدآفتاب مای SPF50', 'My', 'مراقبت پوست', 'ایران', 180.00, 260.00, 220.00, 0, 18, 'دانه', 1, 'active'),
(UUID(), 'SKN-004', '3600542094312', 'میسلار واتر گارنیه ۴۰۰ ملی‌لیتر', 'Garnier', 'پاکسازی پوست', 'فرانسه', 340.00, 460.00, 400.00, 0, 12, 'دانه', 1, 'active'),
(UUID(), 'EYE-001', '3600531143519', 'ریمل میبلین کلاسال', 'Maybelline', 'آرایش چشم', 'آمریکا', 380.00, 550.00, 470.00, 0, 12, 'دانه', 1, 'active'),
(UUID(), 'EYE-002', '8964000351211', 'سرمه هاشمی', 'Hashmi', 'آرایش چشم', 'پاکستان', 40.00, 65.00, 50.00, 0, 50, 'دانه', 1, 'active'),
(UUID(), 'LIP-001', '8691190050127', 'رژ لب مات گلدن رز', 'Golden Rose', 'آرایش لب', 'ترکیه', 150.00, 230.00, 190.00, 0, 30, 'دانه', 1, 'active'),
(UUID(), 'FAC-001', '8690604123414', 'کرم پودر فلورمار پرفکت کاوریج', 'Flormar', 'آرایش صورت', 'ترکیه', 320.00, 450.00, 390.00, 0, 12, 'دانه', 1, 'active'),
(UUID(), 'HAR-001', '4987176018182', 'شامپو هد اند شولدرز ۴۰۰ ملی‌لیتر', 'Head & Shoulders', 'مراقبت مو', 'تایلند', 260.00, 350.00, 310.00, 0, 24, 'دانه', 1, 'active'),
(UUID(), 'HAR-002', '8964000351020', 'حنای طبیعی همانی ۱۰۰ گرم', 'Hemani', 'حنا و رنگ مو', 'پاکستان', 45.00, 70.00, 55.00, 0, 100, 'دانه', 1, 'active'),
(UUID(), 'PRF-001', '6291108730126', 'ادکلن فرگرنس ورلد ۱۰۰ ملی‌لیتر', 'Fragrance World', 'عطر و ادکلن', 'امارات', 815.50, 950.00, 880.00, 0, 6, 'دانه', 0, 'active'),
(UUID(), 'NAL-001', '8680705111012', 'لاک ناخن نوت', 'Note', 'ناخن', 'ترکیه', 90.00, 140.00, 115.00, 0, 24, 'دانه', 1, 'active');

-- ==========================================
-- 4. مشتریان
-- ==========================================
-- «مشتری متفرقه» برای فروش پرچون سر دخل استفاده می‌شود
INSERT INTO customers (id, name, contact_person, phone, email, address, customer_type, credit_limit, status) VALUES
(UUID(), 'مشتری متفرقه (پرچون)', NULL, '0700000000', NULL, NULL, 'retail', 0, 'active'),
(UUID(), 'دوکان لوازم آرایشی ستاره', 'احمد شاه احمدی', '0793322110', NULL, 'کابل، کارته چهار', 'wholesale', 50000, 'active'),
(UUID(), 'فروشگاه آرایشی گلستان', 'محمد علی کریمی', '0784455667', NULL, 'هرات، شهرک غرب', 'wholesale', 80000, 'active'),
(UUID(), 'دوکان بهداشتی نور', 'عبدالرحمن اکبری', '0703322110', NULL, 'مزار شریف، سرک بلخ', 'wholesale', 40000, 'active'),
(UUID(), 'فرشته احمدی (سفارش واتساپ)', 'فرشته احمدی', '0777889900', NULL, 'کابل، خیرخانه', 'online', 0, 'active');

-- ==========================================
-- 5. تامین‌کنندگان
-- ==========================================
INSERT INTO suppliers (id, name, contact_person, phone, email, address, country, currency, products, rating, status) VALUES
(UUID(), 'شرکت تجارتی دیره کاسمتیکس', 'حاجی نصیر', '00971501234567', NULL, 'دبی، دیره', 'امارات', 'AED', 'عطر و ادکلن، نیوآ، گارنیه، میبلین', 5, 'active'),
(UUID(), 'عمده‌فروشی کارخانو', 'گل محمد', '00923001234567', NULL, 'پشاور، مارکیت کارخانو', 'پاکستان', 'PKR', 'گلو اند لاولی، حنای همانی، سرمه هاشمی', 4, 'active'),
(UUID(), 'پخش آرایشی و بهداشتی مشهد', 'رضا محمدی', '00989151234567', NULL, 'مشهد', 'ایران', 'IRR', 'ضدآفتاب مای، شوینده‌ها', 4, 'active'),
(UUID(), 'استانبول کوزمتیک', 'مراد', '00905321234567', NULL, 'استانبول', 'ترکیه', 'USD', 'گلدن رز، فلورمار، نوت', 5, 'active'),
(UUID(), 'عمده‌فروشی مندوی کابل', 'عبدالله', '0799887766', NULL, 'کابل، مندوی', 'افغانستان', 'AFN', 'شامپو، صابون، اقلام بهداشتی', 3, 'active');

-- ==========================================
-- 6. سفارش خرید نمونه (وارداتی از دبی به درهم)
-- ==========================================
SET @admin_id = (SELECT id FROM users WHERE email = 'admin@nowatic.af');
SET @dubai_id = (SELECT id FROM suppliers WHERE name = 'شرکت تجارتی دیره کاسمتیکس');
SET @po1 = UUID();

-- ۲۴ دانه × ۳۸ درهم × نرخ ۱۸٫۵ = ۱۶۸۷۲ + کرایه ۱۵۰۰ + گمرک ۱۲۰۰ = ۱۹۵۷۲ افغانی
INSERT INTO purchase_orders (id, order_number, supplier_id, order_date, delivery_date, currency, exchange_rate, shipping_cost, customs_cost, total_amount, paid_amount, remaining_amount, payment_type, status, payment_status, created_by) VALUES
(@po1, 'PUR-001', @dubai_id, DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'AED', 18.5, 1500, 1200, 19572.00, 10000.00, 9572.00, 'حواله', 'received', 'partial', @admin_id);

INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price, landed_cost, total_price, batch_number, expiry_date) VALUES
(UUID(), @po1, (SELECT id FROM products WHERE sku = 'PRF-001'), 24, 38.00, 815.50, 912.00, 'FW-2026-01', NULL);

-- ==========================================
-- 7. بچ‌های موجودی (لات، تاریخ انقضا، قفسه)
-- ==========================================
INSERT INTO product_batches (id, product_id, batch_number, expiry_date, location, quantity, initial_quantity, cost_price, purchase_order_id) VALUES
(UUID(), (SELECT id FROM products WHERE sku = 'SKN-001'), 'NV-2501', DATE_ADD(CURDATE(), INTERVAL 20 MONTH), 'قفسه A-1', 36, 48, 210.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'SKN-002'), 'GL-2409', DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'قفسه A-2', 6, 72, 72.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'SKN-002'), 'GL-2503', DATE_ADD(CURDATE(), INTERVAL 14 MONTH), 'قفسه A-2', 30, 72, 75.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'SKN-003'), 'MY-2411', DATE_ADD(CURDATE(), INTERVAL 40 DAY), 'قفسه A-3', 14, 24, 180.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'SKN-004'), 'GR-2502', DATE_ADD(CURDATE(), INTERVAL 24 MONTH), 'قفسه A-4', 18, 24, 340.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'EYE-001'), 'MB-2412', DATE_ADD(CURDATE(), INTERVAL 10 MONTH), 'ویترین B-1', 8, 24, 380.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'EYE-002'), 'HS-2501', DATE_ADD(CURDATE(), INTERVAL 30 MONTH), 'ویترین B-1', 120, 144, 40.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'LIP-001'), 'GRS-2502', DATE_ADD(CURDATE(), INTERVAL 26 MONTH), 'ویترین B-2', 42, 60, 150.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'FAC-001'), 'FL-2410', DATE_ADD(CURDATE(), INTERVAL 75 DAY), 'ویترین B-3', 10, 24, 320.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'HAR-001'), 'HNS-2503', DATE_ADD(CURDATE(), INTERVAL 22 MONTH), 'قفسه C-1', 30, 48, 260.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'HAR-002'), 'HM-2502', DATE_ADD(CURDATE(), INTERVAL 18 MONTH), 'قفسه C-2', 85, 200, 45.00, NULL),
(UUID(), (SELECT id FROM products WHERE sku = 'PRF-001'), 'FW-2026-01', NULL, 'ویترین عطر', 20, 24, 815.50, @po1),
(UUID(), (SELECT id FROM products WHERE sku = 'NAL-001'), 'NT-2501', DATE_ADD(CURDATE(), INTERVAL 28 MONTH), 'ویترین B-4', 40, 48, 90.00, NULL);

-- موجودی هر محصول = جمع بچ‌ها
UPDATE products p
SET stock_quantity = (SELECT COALESCE(SUM(b.quantity), 0) FROM product_batches b WHERE b.product_id = p.id);

-- ==========================================
-- 8. سفارشات فروش نمونه
-- ==========================================
SET @walkin_id = (SELECT id FROM customers WHERE name = 'مشتری متفرقه (پرچون)');
SET @setara_id = (SELECT id FROM customers WHERE name = 'دوکان لوازم آرایشی ستاره');
SET @branch_id = (SELECT id FROM branches WHERE code = 'BR-001');
SET @so1 = UUID();
SET @so2 = UUID();

INSERT INTO sales_orders (id, order_number, customer_id, branch_id, sale_type, order_date, subtotal, discount_amount, total_amount, paid_amount, remaining_amount, payment_type, status, payment_status, created_by) VALUES
(@so1, 'ORD-001', @walkin_id, @branch_id, 'retail', CURDATE(), 790.00, 0.00, 790.00, 790.00, 0.00, 'نقدی', 'delivered', 'paid', @admin_id),
(@so2, 'ORD-002', @setara_id, @branch_id, 'wholesale', CURDATE(), 5880.00, 80.00, 5800.00, 3000.00, 2800.00, 'قرض', 'delivered', 'partial', @admin_id);

INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price, cost_price, total_price) VALUES
(UUID(), @so1, (SELECT id FROM products WHERE sku = 'SKN-001'), 2, 280.00, 210.00, 560.00),
(UUID(), @so1, (SELECT id FROM products WHERE sku = 'LIP-001'), 1, 230.00, 150.00, 230.00),
(UUID(), @so2, (SELECT id FROM products WHERE sku = 'SKN-002'), 24, 90.00, 75.00, 2160.00),
(UUID(), @so2, (SELECT id FROM products WHERE sku = 'HAR-001'), 12, 310.00, 260.00, 3720.00);

INSERT INTO payments (id, reference_type, reference_id, amount, payment_date, payment_method, notes, created_by) VALUES
(UUID(), 'sales_order', @so1, 790.00, CURDATE(), 'نقدی', NULL, @admin_id),
(UUID(), 'sales_order', @so2, 3000.00, CURDATE(), 'نقدی', 'پیش‌پرداخت', @admin_id),
(UUID(), 'purchase_order', @po1, 10000.00, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'حواله', NULL, @admin_id);
