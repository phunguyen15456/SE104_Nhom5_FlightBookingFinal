// server.js - Entry point Express
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { testConnection } = require('./config/database');
const routes  = require('./routes/index');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ──────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// 404 handler
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint không tồn tại.' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ.' });
});

// ── Start ───────────────────────────────────────────────────
async function start() {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
        console.log(`📋 API Docs: http://localhost:${PORT}/api/health`);
    });
}

start();
