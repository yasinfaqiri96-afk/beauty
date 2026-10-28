-- ==========================================
-- سیستم مدیریت نواتیک - فروشگاه لوازم آرایشی و بهداشتی
-- MySQL Schema
-- ==========================================
-- منطق اصلی:
--   * هر محصول چند «بچ» (لات) دارد؛ هر بچ تاریخ انقضا و قیمت تمام‌شده خود را دارد
--   * موجودی محصول = جمع موجودی بچ‌ها (products.stock_quantity همیشه با بچ‌ها هم‌گام است)
--   * فروش به روش FEFO از بچ‌هایی که زودتر منقضی می‌شوند کم می‌شود؛ بچ منقضی فروخته نمی‌شود
--   * خرید وارداتی با اسعار (دالر، درهم، کلدار، تومان، لیره) و نرخ تبادله ثبت می‌شود
--     و کرایه و محصول گمرکی روی قیمت تمام‌شده هر قلم سرشکن می‌شود
--   * فروش پرچون (قیمت پرچون) و عمده (قیمت عمده) و حساب قرض مشتری با سقف اعتبار
-- ==========================================

CREATE DATABASE IF NOT EXISTS nowatic_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nowatic_management;

-- ==========================================
-- 1. جدول کاربران
-- ==========================================
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
  branch_id CHAR(36),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 2. جدول شعبات
-- ==========================================
CREATE TABLE branches (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  manager_name VARCHAR(255),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 3. جدول محصولات
-- ==========================================
-- purchase_price: آخرین قیمت تمام‌شده یک دانه (با کرایه و گمرک) به افغانی
-- sale_price: قیمت پرچون، wholesale_price: قیمت عمده برای دوکانداران
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sku VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(64),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  origin VARCHAR(100),
  purchase_price DECIMAL(15,2) NOT NULL,
  sale_price DECIMAL(15,2) NOT NULL,
  wholesale_price DECIMAL(15,2),
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) DEFAULT 'دانه',
  track_expiry TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku (sku),
  INDEX idx_barcode (barcode),
  INDEX idx_brand (brand),
  INDEX idx_category (category),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 4. جدول مشتریان
-- ==========================================
-- retail: مشتری پرچون، wholesale: دوکاندار/عمده‌خر، online: سفارش واتساپ/فیسبوک/انستاگرام
-- credit_limit: سقف قرض مجاز (۰ یعنی بدون قرض)
CREATE TABLE customers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  customer_type ENUM('retail', 'wholesale', 'online') NOT NULL DEFAULT 'retail',
  credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_type (customer_type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 5. جدول تامین‌کنندگان
-- ==========================================
CREATE TABLE suppliers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  country VARCHAR(100),
  currency ENUM('AFN', 'USD', 'AED', 'PKR', 'IRR', 'TRY', 'CNY') NOT NULL DEFAULT 'AFN',
  products TEXT,
  rating TINYINT CHECK (rating >= 1 AND rating <= 5),
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 6. جدول سفارشات فروش (فاکتور فروش)
-- ==========================================
-- subtotal: جمع اقلام، discount_amount: تخفیف، total_amount = subtotal - discount_amount
CREATE TABLE sales_orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id CHAR(36) NOT NULL,
  branch_id CHAR(36),
  sale_type ENUM('retail', 'wholesale') NOT NULL DEFAULT 'retail',
  order_date DATE NOT NULL,
  delivery_date DATE,
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL,
  payment_type VARCHAR(50),
  status ENUM('pending', 'processing', 'delivered', 'cancelled', 'returned') NOT NULL DEFAULT 'delivered',
  payment_status ENUM('paid', 'partial', 'unpaid') NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_number (order_number),
  INDEX idx_customer (customer_id),
  INDEX idx_order_date (order_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 7. جدول اقلام سفارش فروش
-- ==========================================
-- cost_price: قیمت تمام‌شده میانگین بچ‌های مصرف‌شده، برای محاسبه سود واقعی
CREATE TABLE sales_order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sales_order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_sales_order (sales_order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 8. جدول سفارشات خرید
-- ==========================================
-- currency/exchange_rate: اسعار خرید و نرخ تبادله به افغانی
-- shipping_cost/customs_cost: کرایه و محصول گمرکی به افغانی
-- total_amount: مبلغ کل به افغانی = (جمع اقلام × نرخ) + کرایه + گمرک
CREATE TABLE purchase_orders (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id CHAR(36) NOT NULL,
  order_date DATE NOT NULL,
  delivery_date DATE,
  currency ENUM('AFN', 'USD', 'AED', 'PKR', 'IRR', 'TRY', 'CNY') NOT NULL DEFAULT 'AFN',
  exchange_rate DECIMAL(15,4) NOT NULL DEFAULT 1,
  shipping_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  customs_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  remaining_amount DECIMAL(15,2) NOT NULL,
  payment_type VARCHAR(50),
  status ENUM('pending', 'shipping', 'received', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('paid', 'partial', 'unpaid') NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_order_number (order_number),
  INDEX idx_supplier (supplier_id),
  INDEX idx_order_date (order_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 9. جدول اقلام سفارش خرید
-- ==========================================
-- unit_price به اسعار سفارش، landed_cost قیمت تمام‌شده یک دانه به افغانی
CREATE TABLE purchase_order_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  purchase_order_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  landed_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(15,2) NOT NULL,
  batch_number VARCHAR(100),
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_purchase_order (purchase_order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 10. جدول بچ‌های موجودی (لات + تاریخ انقضا + موقعیت قفسه)
-- ==========================================
CREATE TABLE product_batches (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  batch_number VARCHAR(100),
  expiry_date DATE,
  location VARCHAR(100),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  initial_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  purchase_order_id CHAR(36),
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
  INDEX idx_product (product_id),
  INDEX idx_expiry (expiry_date),
  INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 11. جدول پرداخت‌ها (دریافت قرض مشتری / پرداخت به تامین‌کننده)
-- ==========================================
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reference_type ENUM('sales_order', 'purchase_order') NOT NULL,
  reference_id CHAR(36) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- 12. جدول تراکنش‌های موجودی
-- ==========================================
-- in: ورود (خرید/موجودی اولیه)، out: خروج (فروش)، return: برگشت فروش
-- adjustment: اصلاح شمارش، damage: ضایعات/شکسته، expired: معدوم کردن کالای منقضی
CREATE TABLE inventory_transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  batch_id CHAR(36),
  transaction_type ENUM('in', 'out', 'return', 'adjustment', 'damage', 'expired') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id CHAR(36),
  notes TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (batch_id) REFERENCES product_batches(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product (product_id),
  INDEX idx_batch (batch_id),
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Foreign Key برای users.branch_id
-- ==========================================
ALTER TABLE users ADD CONSTRAINT fk_users_branch
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;
