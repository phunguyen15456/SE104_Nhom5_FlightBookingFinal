// dal/flightDAL.js - Data Access Layer cho chuyến bay
const { pool } = require('../config/database');

const FlightDAL = {
    /**
     * Lấy danh sách chuyến bay có phân trang và lọc
     */
async getAll({ maSBDi, maSBDen, ngayBay, page = 1, limit = 10 }) {
    let where = '1=1';
    const params = [];

    if (maSBDi) { where += ' AND cb.MaSanBayDi = ?'; params.push(maSBDi); }
    if (maSBDen) { where += ' AND cb.MaSanBayDen = ?'; params.push(maSBDen); }
    if (ngayBay) { where += ' AND DATE(cb.NgayGio) = ?'; params.push(ngayBay); }

    const limitNum  = parseInt(limit);
    const offsetNum = (parseInt(page) - 1) * limitNum;

    const [rows] = await pool.query(
        `SELECT cb.*,
                sbd.TenSanBay AS TenSanBayDi,
                sbn.TenSanBay AS TenSanBayDen,
                (SELECT CAST(SUM(SLGheConLai) AS UNSIGNED) FROM CHITIETHANGVE WHERE MaChuyenBay = cb.MaChuyenBay) AS TongGheConLai
         FROM CHUYENBAY cb
         JOIN SANBAY sbd ON cb.MaSanBayDi = sbd.MaSanBay
         JOIN SANBAY sbn ON cb.MaSanBayDen = sbn.MaSanBay
         WHERE ${where}
         ORDER BY cb.NgayGio ASC
         LIMIT ${limitNum} OFFSET ${offsetNum}`,
        params
    );

    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM CHUYENBAY cb WHERE ${where}`,
        params
    );

    return { data: rows, total, page, limit };
},

    /**
     * Lấy chi tiết chuyến bay kèm hạng vé và sân bay trung gian
     */
    async getById(maChuyenBay) {
        const [[flight]] = await pool.execute(
            `SELECT cb.*,
                    sbd.TenSanBay AS TenSanBayDi,
                    sbn.TenSanBay AS TenSanBayDen
             FROM CHUYENBAY cb
             JOIN SANBAY sbd ON cb.MaSanBayDi = sbd.MaSanBay
             JOIN SANBAY sbn ON cb.MaSanBayDen = sbn.MaSanBay
             WHERE cb.MaChuyenBay = ?`,
            [maChuyenBay]
        );
        if (!flight) return null;

        const [hangVe] = await pool.execute(
            `SELECT cthv.*, hv.TenHangVe, hv.TiLe,
                    ROUND(cb.GiaVe * hv.TiLe / 100) AS GiaHangVe
             FROM CHITIETHANGVE cthv
             JOIN HANGVE hv ON cthv.MaHangVe = hv.MaHangVe
             JOIN CHUYENBAY cb ON cthv.MaChuyenBay = cb.MaChuyenBay
             WHERE cthv.MaChuyenBay = ?`,
            [maChuyenBay]
        );

        const [trunggian] = await pool.execute(
            `SELECT ctsbtg.*, sb.TenSanBay
             FROM CT_SANBAYTRUNGGIAN ctsbtg
             JOIN SANBAY sb ON ctsbtg.MaSanBay = sb.MaSanBay
             WHERE ctsbtg.MaChuyenBay = ?
             ORDER BY ctsbtg.MaCT`,
            [maChuyenBay]
        );

        return { ...flight, hangVe, sanBayTrungGian: trunggian };
    },

    /**
     * Tạo chuyến bay mới
     */
    async create({ maChuyenBay, giaVe, ngayGio, thoiGianBay, maSanBayDi, maSanBayDen }) {
        await pool.execute(
            `INSERT INTO CHUYENBAY (MaChuyenBay, GiaVe, NgayGio, ThoiGianBay, MaSanBayDi, MaSanBayDen)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [maChuyenBay, giaVe, ngayGio, thoiGianBay, maSanBayDi, maSanBayDen]
        );
    },

    /**
     * Cập nhật thông tin chuyến bay
     */
    async update(maChuyenBay, fields) {
        const allowed = ['GiaVe', 'NgayGio', 'ThoiGianBay', 'MaSanBayDi', 'MaSanBayDen'];
        const sets = Object.keys(fields).filter(k => allowed.includes(k));
        if (sets.length === 0) return false;

        const values = sets.map(k => fields[k]);
        const setClause = sets.map(k => `${k} = ?`).join(', ');

        const [result] = await pool.execute(
            `UPDATE CHUYENBAY SET ${setClause} WHERE MaChuyenBay = ?`,
            [...values, maChuyenBay]
        );
        return result.affectedRows > 0;
    },

    /**
     * Xoá chuyến bay (kiểm tra ràng buộc trước)
     */
    async delete(maChuyenBay) {
        const [[{ count }]] = await pool.execute(
            'SELECT COUNT(*) as count FROM PHIEUDATCHO WHERE MaChuyenBay = ? AND TrangThai != ?',
            [maChuyenBay, 'cancelled']
        );
        if (count > 0) throw new Error('Không thể xoá chuyến bay đã có vé đặt.');

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            await conn.execute('DELETE FROM CHITIETHANGVE WHERE MaChuyenBay = ?', [maChuyenBay]);
            await conn.execute('DELETE FROM CT_SANBAYTRUNGGIAN WHERE MaChuyenBay = ?', [maChuyenBay]);
            await conn.execute('DELETE FROM CHUYENBAY WHERE MaChuyenBay = ?', [maChuyenBay]);
            await conn.commit();
            return true;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Thêm/cập nhật chi tiết hạng vé
     */
    async upsertHangVe(maChuyenBay, maHangVe, slGhe) {
        await pool.execute(
            `INSERT INTO CHITIETHANGVE (MaChuyenBay, MaHangVe, SLGhe, SLGheConLai)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE SLGhe = ?, SLGheConLai = ?`,
            [maChuyenBay, maHangVe, slGhe, slGhe, slGhe, slGhe]
        );
    },

    /**
     * Thêm sân bay trung gian
     */
    async addTrungGian({ maCT, thoiGianDung, ghiChu, maChuyenBay, maSanBay }) {
        await pool.execute(
            `INSERT INTO CT_SANBAYTRUNGGIAN (MaCT, ThoiGianDung, GhiChu, MaChuyenBay, MaSanBay)
             VALUES (?, ?, ?, ?, ?)`,
            [maCT, thoiGianDung, ghiChu || null, maChuyenBay, maSanBay]
        );
    }
};

module.exports = FlightDAL;
