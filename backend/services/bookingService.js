// services/bookingService.js - Business logic đặt vé
const BookingDAL = require('../dal/bookingDAL');
const { pool } = require('../config/database');

async function getThamSo(tenThamSo) {
    const [[row]] = await pool.execute(
        'SELECT GiaTri FROM THAMSO WHERE TenThamSo = ?', [tenThamSo]
    );
    return row ? row.GiaTri : null;
}

async function generateId(prefix, table, pkColumn) {
    const [rows] = await pool.execute(
        `SELECT ${pkColumn} FROM ${table} ORDER BY ${pkColumn} DESC LIMIT 1`
    );
    if (rows.length === 0) return `${prefix}001`;
    const lastNum = parseInt(rows[0][pkColumn].replace(prefix, '')) || 0;
    return `${prefix}${String(lastNum + 1).padStart(3, '0')}`;
}

const BookingService = {
    /**
     * Đặt chỗ - kiểm tra điều kiện rồi gọi DAL
     */
    async datCho({ maHK, maChuyenBay, maHangVe }) {
        // Kiểm tra chuyến bay tồn tại và thời gian đặt vé
        const [[flight]] = await pool.execute(
            'SELECT NgayGio FROM CHUYENBAY WHERE MaChuyenBay = ?', [maChuyenBay]
        );
        if (!flight) throw new Error('Chuyến bay không tồn tại.');

        const tgDatVeChamNhat = await getThamSo('TGDatVeChamNhat') || 12;
        const gioTruocKhiBay = (new Date(flight.NgayGio) - new Date()) / 3600000;
        if (gioTruocKhiBay < tgDatVeChamNhat) {
            throw new Error(`Chỉ được đặt vé trước giờ bay ít nhất ${tgDatVeChamNhat} giờ.`);
        }

        // Tính giá vé
        const [[hangVe]] = await pool.execute(
            `SELECT cthv.SLGheConLai, hv.TiLe, cb.GiaVe
             FROM CHITIETHANGVE cthv
             JOIN HANGVE hv ON cthv.MaHangVe = hv.MaHangVe
             JOIN CHUYENBAY cb ON cthv.MaChuyenBay = cb.MaChuyenBay
             WHERE cthv.MaChuyenBay = ? AND cthv.MaHangVe = ?`,
            [maChuyenBay, maHangVe]
        );
        if (!hangVe) throw new Error('Hạng vé không hợp lệ cho chuyến bay này.');
        if (hangVe.SLGheConLai <= 0) throw new Error('Không còn ghế trống cho hạng vé này.');

        const giaTien = Math.round(hangVe.GiaVe * hangVe.TiLe / 100);
        const maPhieuDat = await generateId('PD', 'PHIEUDATCHO', 'MaPhieuDat');

        return BookingDAL.createPhieuDat({ maPhieuDat, giaTien, maHK, maChuyenBay, maHangVe });
    },

    /**
     * Xác nhận & xuất vé
     */
    async xuatVe(maPhieuDat) {
        const maVe = await generateId('VE', 'VECHUYENBAY', 'MaVe');
        return BookingDAL.confirmAndIssueTicket(maPhieuDat, maVe);
    },

    /**
     * Huỷ đặt chỗ
     */
    async huyDatCho(maPhieuDat, maHKYeuCau) {
        // Kiểm tra chủ sở hữu
        const [[phieu]] = await pool.execute(
            'SELECT MaHK, MaChuyenBay FROM PHIEUDATCHO WHERE MaPhieuDat = ?', [maPhieuDat]
        );
        if (!phieu) throw new Error('Phiếu đặt không tồn tại.');
        if (maHKYeuCau && phieu.MaHK !== maHKYeuCau) {
            throw new Error('Bạn không có quyền huỷ phiếu đặt này.');
        }

        return BookingDAL.cancelPhieuDat(maPhieuDat);
    },

    async lichSu(maHK) {
        return BookingDAL.getByHanhKhach(maHK);
    },

    async doanhThuThang(nam) {
        return BookingDAL.revenueByMonth(nam);
    },

    async doanhThuChuyenBay(nam, thang) {
        return BookingDAL.revenueByFlight(nam, thang);
    },

    async getAllBookings() {
        const [rows] = await pool.execute(
            `SELECT pdc.*, hk.TenHanhKhach, cb.NgayGio,
                    sbd.TenSanBay AS TenSBDi, sbn.TenSanBay AS TenSBDen,
                    hv.TenHangVe, ve.MaVe
             FROM PHIEUDATCHO pdc
             JOIN HANHKHACH hk ON pdc.MaHK = hk.MaHK
             JOIN CHUYENBAY cb ON pdc.MaChuyenBay = cb.MaChuyenBay
             JOIN SANBAY sbd ON cb.MaSanBayDi = sbd.MaSanBay
             JOIN SANBAY sbn ON cb.MaSanBayDen = sbn.MaSanBay
             JOIN HANGVE hv ON pdc.MaHangVe = hv.MaHangVe
             LEFT JOIN VECHUYENBAY ve ON ve.MaPhieuDat = pdc.MaPhieuDat
             ORDER BY pdc.NgayDat DESC`
        );
        return rows;
    }
};

module.exports = BookingService;
