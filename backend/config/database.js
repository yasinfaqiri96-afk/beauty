import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ایجاد Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nowatic_management',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// تست اتصال
pool.getConnection()
  .then(connection => {
    console.log('✅ اتصال به MySQL موفقیت‌آمیز بود');
    connection.release();
  })
  .catch(err => {
    console.error('❌ خطا در اتصال به MySQL:', err.message);
  });

export default pool;
