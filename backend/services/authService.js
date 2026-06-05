// services/authService.js - Business logic xác thực
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthDAL = require('../dal/authDAL');
const { pool } = require('../config/database');

const AuthService = {
    /**
     * Đăng nhập
     */
    async login(tenDangNhap, matKhau) {
        const taiKhoan = await AuthDAL.findByUsername(tenDangNhap);
        if (!taiKhoan) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');

        const isMatch = await bcrypt.compare(matKhau, taiKhoan.MatKhau);
        if (!isMatch) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');

        const token = jwt.sign(
            { maTK: taiKhoan.MaTK, tenDangNhap: taiKhoan.TenDangNhap, vaiTro: taiKhoan.VaiTro, maHK: taiKhoan.MaHK },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return {
            token,
            user: {
                maTK: taiKhoan.MaTK,
                tenDangNhap: taiKhoan.TenDangNhap,
                vaiTro: taiKhoan.VaiTro,
                maHK: taiKhoan.MaHK,
                tenHanhKhach: taiKhoan.TenHanhKhach
            }
        };
    },

    /**
     * Đăng ký tài khoản (Customer)
     */
    async register({ tenDangNhap, matKhau, tenHanhKhach, cmnd, soDT }) {
        // Kiểm tra tên đăng nhập đã tồn tại
        const existing = await AuthDAL.findByUsername(tenDangNhap);
        if (existing) throw new Error('Tên đăng nhập đã tồn tại.');

        // Kiểm tra CMND hợp lệ (9 hoặc 12 số)
        if (!/^[0-9]{9}$|^[0-9]{12}$/.test(cmnd)) {
            throw new Error('CMND/CCCD phải có 9 hoặc 12 chữ số.');
        }

        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const matKhauHash = await bcrypt.hash(matKhau, rounds);

        // Tạo mã hành khách
        const maHK = await AuthDAL.generateId('HK', 'HANHKHACH', 'MaHK');
        const maTK = await AuthDAL.generateId('TK', 'TAIKHOAN', 'MaTK');

        // Tạo hành khách và tài khoản
        await pool.execute(
            'INSERT INTO HANHKHACH (MaHK, TenHanhKhach, CMND, SoDT) VALUES (?, ?, ?, ?)',
            [maHK, tenHanhKhach, cmnd, soDT || null]
        );
        await AuthDAL.create({ maTK, tenDangNhap, matKhauHash, vaiTro: 'customer', maHK });

        return { maTK, maHK, tenDangNhap, vaiTro: 'customer' };
    },

    /**
     * Tạo tài khoản manager/admin (chỉ Admin)
     */
    async createStaff({ tenDangNhap, matKhau, vaiTro }) {
        const existing = await AuthDAL.findByUsername(tenDangNhap);
        if (existing) throw new Error('Tên đăng nhập đã tồn tại.');

        if (!['manager', 'admin'].includes(vaiTro)) {
            throw new Error('Vai trò không hợp lệ. Chỉ chấp nhận: manager, admin.');
        }

        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
        const matKhauHash = await bcrypt.hash(matKhau, rounds);
        const maTK = await AuthDAL.generateId('TK', 'TAIKHOAN', 'MaTK');

        await AuthDAL.create({ maTK, tenDangNhap, matKhauHash, vaiTro, maHK: null });
        return { maTK, tenDangNhap, vaiTro };
    },

    /**
     * Đổi mật khẩu
     */
    async changePassword(maTK, matKhauCu, matKhauMoi) {
        const [rows] = await pool.execute(
            'SELECT MatKhau FROM TAIKHOAN WHERE MaTK = ?', [maTK]
        );
        if (!rows[0]) throw new Error('Tài khoản không tồn tại.');

        const isMatch = await bcrypt.compare(matKhauCu, rows[0].MatKhau);
        if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng.');

        const hash = await bcrypt.hash(matKhauMoi, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        await AuthDAL.updatePassword(maTK, hash);
    }
};

module.exports = AuthService;
