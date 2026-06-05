// config/database.js - Kết nối MySQL với connection pool
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'flight_booking',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    charset: 'utf8mb4',
    timezone: '+07:00'
});

// Kiểm tra kết nối khi khởi động
async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('✅ Kết nối Database thành công!');
        conn.release();
    } catch (err) {
        console.error('❌ Lỗi kết nối Database:', err.message);
        process.exit(1);
    }
}

module.exports = { pool, testConnection };
