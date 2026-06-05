// services/thamsoService.js - Quản lý tham số hệ thống + ghi log
const { pool } = require('../config/database');

const ThamSoService = {
    async getAll() {
        const [rows] = await pool.execute('SELECT * FROM THAMSO ORDER BY MaThamSo');
        return rows;
    },

    async getByName(tenThamSo) {
        const [[row]] = await pool.execute(
            'SELECT * FROM THAMSO WHERE TenThamSo = ?', [tenThamSo]
        );
        return row || null;
    },

    /**
     * Cập nhật tham số - ghi log tự động
     */
    async update(maThamSo, giaTriMoi, nguoiSua) {
        const [[current]] = await pool.execute(
            'SELECT GiaTri FROM THAMSO WHERE MaThamSo = ?', [maThamSo]
        );
        if (!current) throw new Error('Tham số không tồn tại.');

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            await conn.execute(
                'UPDATE THAMSO SET GiaTri = ? WHERE MaThamSo = ?',
                [giaTriMoi, maThamSo]
            );

            // Ghi log tự động
            await conn.execute(
                `INSERT INTO LOG_THAMSO (MaThamSo, GiaTriCu, GiaTriMoi, NguoiSua)
                 VALUES (?, ?, ?, ?)`,
                [maThamSo, current.GiaTri, giaTriMoi, nguoiSua]
            );

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    async getLogs() {
        const [rows] = await pool.execute(
            `SELECT l.*, t.TenThamSo
             FROM LOG_THAMSO l
             JOIN THAMSO t ON l.MaThamSo = t.MaThamSo
             ORDER BY l.ThoiGian DESC
             LIMIT 100`
        );
        return rows;
    },

    // Hạng vé
    async getAllHangVe() {
        const [rows] = await pool.execute('SELECT * FROM HANGVE ORDER BY MaHangVe');
        return rows;
    },

    async addHangVe(maHangVe, tenHangVe, tiLe) {
        try {
            await pool.execute(
                'INSERT INTO HANGVE (MaHangVe, TenHangVe, TiLe) VALUES (?, ?, ?)',
                [maHangVe, tenHangVe, tiLe]
            );
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') throw new Error('Mã hạng vé đã tồn tại.');
            throw err;
        }
    },

    async updateHangVe(maHangVe, tenHangVe, tiLe) {
        const [result] = await pool.execute(
            'UPDATE HANGVE SET TenHangVe = ?, TiLe = ? WHERE MaHangVe = ?',
            [tenHangVe, tiLe, maHangVe]
        );
        if (result.affectedRows === 0) throw new Error('Hạng vé không tồn tại.');
    },

    async deleteHangVe(maHangVe) {
        const [[{ count }]] = await pool.execute(
            'SELECT COUNT(*) as count FROM CHITIETHANGVE WHERE MaHangVe = ?', [maHangVe]
        );
        if (count > 0) throw new Error('Không thể xoá hạng vé đang được sử dụng.');
        await pool.execute('DELETE FROM HANGVE WHERE MaHangVe = ?', [maHangVe]);
    }
};

module.exports = ThamSoService;
