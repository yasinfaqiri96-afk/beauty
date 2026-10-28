import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import customersRoutes from './routes/customers.js';
import salesRoutes from './routes/sales.js';
import purchaseRoutes from './routes/purchase.js';
import suppliersRoutes from './routes/suppliers.js';
import warehouseRoutes from './routes/warehouse.js';
import branchesRoutes from './routes/branches.js';
import dashboardRoutes from './routes/dashboard.js';
import reportsRoutes from './routes/reports.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/warehouse', warehouseRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'سرور به درستی کار می‌کند',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'مسیر یافت نشد' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('خطای سرور:', err);
  res.status(500).json({ 
    success: false, 
    message: 'خطای داخلی سرور',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 سرور نواتیک با موفقیت راه‌اندازی شد            ║
║                                                       ║
║   📡 آدرس: http://localhost:${PORT}                    ║
║   🌍 محیط: ${process.env.NODE_ENV || 'development'}                      ║
║   📅 زمان: ${new Date().toLocaleString('fa-IR')}      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export default app;
