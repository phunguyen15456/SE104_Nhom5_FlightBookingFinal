// dal/authDAL.js - Data Access Layer cho xác thực
const { pool } = require('../config/database');

const AuthDAL = {
    /**
     * Tìm tài khoản theo tên đăng nhập
     */
    async findByUsername(tenDangNhap) {
        const [rows] = await pool.execute(
            `SELECT tk.*, hk.TenHanhKhach, hk.CMND, hk.SoDT
             FROM TAIKHOAN tk
             LEFT JOIN HANHKHACH hk ON tk.MaHK = hk.MaHK
             WHERE tk.TenDangNhap = ? AND tk.TrangThai = 1`,
            [tenDangNhap]
        );
        return rows[0] || null;
    },

    /**
     * Tạo tài khoản mới
     */
    async create({ maTK, tenDangNhap, matKhauHash, vaiTro, maHK }) {
        await pool.execute(
            `INSERT INTO TAIKHOAN (MaTK, TenDangNhap, MatKhau, VaiTro, MaHK)
             VALUES (?, ?, ?, ?, ?)`,
            [maTK, tenDangNhap, matKhauHash, vaiTro, maHK || null]
        );
    },

    /**
     * Lấy danh sách tài khoản (cho Admin)
     */
    async getAll() {
        const [rows] = await pool.execute(
            `SELECT tk.MaTK, tk.TenDangNhap, tk.VaiTro, tk.NgayTao, tk.TrangThai,
                    hk.TenHanhKhach, hk.CMND, hk.SoDT
             FROM TAIKHOAN tk
             LEFT JOIN HANHKHACH hk ON tk.MaHK = hk.MaHK
             ORDER BY tk.NgayTao DESC`
        );
        return rows;
    },

    /**
     * Cập nhật vai trò tài khoản
     */
    async updateRole(maTK, vaiTro) {
        const [result] = await pool.execute(
            'UPDATE TAIKHOAN SET VaiTro = ? WHERE MaTK = ?',
            [vaiTro, maTK]
        );
        return result.affectedRows > 0;
    },

    /**
     * Vô hiệu hoá tài khoản
     */
    async deactivate(maTK) {
        const [result] = await pool.execute(
            'UPDATE TAIKHOAN SET TrangThai = 0 WHERE MaTK = ?',
            [maTK]
        );
        return result.affectedRows > 0;
    },

    /**
     * Đổi mật khẩu
     */
    async updatePassword(maTK, matKhauHash) {
        await pool.execute(
            'UPDATE TAIKHOAN SET MatKhau = ? WHERE MaTK = ?',
            [matKhauHash, maTK]
        );
    },

    /**
     * Tạo mã tự động (đơn giản, production nên dùng UUID)
     */
    async generateId(prefix, table, pkColumn) {
        const [rows] = await pool.execute(
            `SELECT ${pkColumn} FROM ${table} ORDER BY ${pkColumn} DESC LIMIT 1`
        );
        if (rows.length === 0) return `${prefix}001`;
        const lastNum = parseInt(rows[0][pkColumn].replace(prefix, '')) || 0;
        return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
    }
};

module.exports = AuthDAL;
