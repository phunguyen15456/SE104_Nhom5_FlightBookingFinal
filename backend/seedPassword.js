require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function seed() {
  const users = [
    { maTK: 'TK001', password: 'Admin@123' },
    { maTK: 'TK002', password: 'Manager@123' },
    { maTK: 'TK003', password: 'Customer@123' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute('UPDATE TAIKHOAN SET MatKhau = ? WHERE MaTK = ?', [hash, u.maTK]);
    console.log(`✅ ${u.maTK} done`);
  }
  process.exit(0);
}
seed();