// dal/bookingDAL.js - Data Access Layer cho đặt vé (dùng Transaction)
const { pool } = require('../config/database');

const BookingDAL = {
    /**
     * Đặt chỗ với Transaction - giữ ghế và tạo phiếu
     */
    async createPhieuDat({ maPhieuDat, giaTien, maHK, maChuyenBay, maHangVe }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // 1. Khoá dòng để kiểm tra ghế trống (FOR UPDATE)
            const [[seat]] = await conn.execute(
                'SELECT SLGheConLai FROM CHITIETHANGVE WHERE MaChuyenBay = ? AND MaHangVe = ? FOR UPDATE',
                [maChuyenBay, maHangVe]
            );

            if (!seat || seat.SLGheConLai <= 0) {
                await conn.rollback();
                throw new Error('Không còn ghế trống cho hạng vé này.');
            }

            // 2. Giảm số ghế còn lại
            await conn.execute(
                'UPDATE CHITIETHANGVE SET SLGheConLai = SLGheConLai - 1 WHERE MaChuyenBay = ? AND MaHangVe = ?',
                [maChuyenBay, maHangVe]
            );

            // 3. Tạo phiếu đặt chỗ
            await conn.execute(
                `INSERT INTO PHIEUDATCHO (MaPhieuDat, GiaTien, MaHK, MaChuyenBay, MaHangVe, TrangThai)
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [maPhieuDat, giaTien, maHK, maChuyenBay, maHangVe]
            );

            await conn.commit();
            return { success: true, maPhieuDat };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Xác nhận đặt chỗ và xuất vé
     */
    async confirmAndIssueTicket(maPhieuDat, maVe) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Kiểm tra phiếu đặt
            const [[phieu]] = await conn.execute(
                'SELECT * FROM PHIEUDATCHO WHERE MaPhieuDat = ? AND TrangThai = ? FOR UPDATE',
                [maPhieuDat, 'pending']
            );
            if (!phieu) throw new Error('Phiếu đặt không tồn tại hoặc đã xử lý.');

            // Cập nhật trạng thái phiếu
            await conn.execute(
                "UPDATE PHIEUDATCHO SET TrangThai = 'confirmed' WHERE MaPhieuDat = ?",
                [maPhieuDat]
            );

            // Tạo vé
            await conn.execute(
                'INSERT INTO VECHUYENBAY (MaVe, MaPhieuDat) VALUES (?, ?)',
                [maVe, maPhieuDat]
            );

            await conn.commit();
            return { success: true, maVe };
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    /**
     * Huỷ đặt chỗ - hoàn lại ghế
     */
    async cancelPhieuDat(maPhieuDat) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [[phieu]] = await conn.execute(
                'SELECT * FROM PHIEUDATCHO WHERE MaPhieuDat = ? FOR UPDATE',
                [maPhieuDat]
            );
            if (!phieu) throw new Error('Phiếu đặt không tồn tại.');
            if (phieu.TrangThai === 'cancelled') throw new Error('Phiếu đặt đã bị huỷ trước đó.');

            // Cập nhật trạng thái
            await conn.execute(
                "UPDATE PHIEUDATCHO SET TrangThai = 'cancelled' WHERE MaPhieuDat = ?",
                [maPhieuDat]
            );

            // Hoàn lại ghế (chỉ nếu chưa bán vé)
            const [[ve]] = await conn.execute(
                'SELECT MaVe FROM VECHUYENBAY WHERE MaPhieuDat = ?',
                [maPhieuDat]
            );
            if (!ve) {
                await conn.execute(
                    'UPDATE CHITIETHANGVE SET SLGheConLai = SLGheConLai + 1 WHERE MaChuyenBay = ? AND MaHangVe = ?',
                    [phieu.MaChuyenBay, phieu.MaHangVe]
                );
            }

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
     * Lấy lịch sử đặt vé của hành khách
     */
    async getByHanhKhach(maHK) {
    const [rows] = await pool.execute(
        `SELECT pdc.*, 
                cb.NgayGio, cb.ThoiGianBay,
                cb.MaSanBayDi, cb.MaSanBayDen,
                sbd.TenSanBay AS TenSBDi,
                sbn.TenSanBay AS TenSBDen,
                hv.TenHangVe,
                ve.MaVe
         FROM PHIEUDATCHO pdc
         JOIN CHUYENBAY cb   ON pdc.MaChuyenBay = cb.MaChuyenBay
         JOIN SANBAY sbd     ON cb.MaSanBayDi = sbd.MaSanBay
         JOIN SANBAY sbn     ON cb.MaSanBayDen = sbn.MaSanBay
         JOIN HANGVE hv      ON pdc.MaHangVe = hv.MaHangVe
         LEFT JOIN VECHUYENBAY ve ON ve.MaPhieuDat = pdc.MaPhieuDat
         WHERE pdc.MaHK = ?
         ORDER BY pdc.NgayDat DESC`,
        [maHK]
    );
    return rows;
},

    /**
     * Báo cáo doanh thu theo tháng
     */
    async revenueByMonth(nam) {
        const [rows] = await pool.execute(
            `SELECT
                MONTH(pdc.NgayDat) AS Thang,
                COUNT(pdc.MaPhieuDat) AS SoVe,
                SUM(pdc.GiaTien) AS DoanhThu
             FROM PHIEUDATCHO pdc
             WHERE YEAR(pdc.NgayDat) = ? AND pdc.TrangThai = 'confirmed'
             GROUP BY MONTH(pdc.NgayDat)
             ORDER BY Thang`,
            [nam]
        );
        return rows;
    },

    /**
     * Báo cáo doanh thu theo chuyến bay (trong tháng)
     */
    async revenueByFlight(nam, thang) {
        const [rows] = await pool.execute(
            `SELECT
                cb.MaChuyenBay,
                sbd.TenSanBay AS TenSanBayDi,
                sbn.TenSanBay AS TenSanBayDen,
                cb.NgayGio,
                COUNT(pdc.MaPhieuDat) AS SoVe,
                SUM(pdc.GiaTien) AS DoanhThu
             FROM PHIEUDATCHO pdc
             JOIN CHUYENBAY cb ON pdc.MaChuyenBay = cb.MaChuyenBay
             JOIN SANBAY sbd ON cb.MaSanBayDi = sbd.MaSanBay
             JOIN SANBAY sbn ON cb.MaSanBayDen = sbn.MaSanBay
             WHERE YEAR(pdc.NgayDat) = ?
               AND MONTH(pdc.NgayDat) = ?
               AND pdc.TrangThai = 'confirmed'
             GROUP BY cb.MaChuyenBay, sbd.TenSanBay, sbn.TenSanBay, cb.NgayGio
             ORDER BY DoanhThu DESC`,
            [nam, thang]
        );
        return rows;
    }
};

module.exports = BookingDAL;
