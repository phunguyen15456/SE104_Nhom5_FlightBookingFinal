// controllers/bookingController.js
const BookingService = require('../services/bookingService');

const BookingController = {
    async datCho(req, res) {
        try {
            const { maChuyenBay, maHangVe } = req.body;
            const maHK = req.user.maHK;
            if (!maHK) return res.status(400).json({ success: false, message: 'Tài khoản không liên kết hành khách.' });
            if (!maChuyenBay || !maHangVe)
                return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt chỗ.' });

            const result = await BookingService.datCho({ maHK, maChuyenBay, maHangVe });
            res.status(201).json({ success: true, message: 'Đặt chỗ thành công.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async xuatVe(req, res) {
        try {
            const result = await BookingService.xuatVe(req.params.maPhieuDat);
            res.json({ success: true, message: 'Xuất vé thành công.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async huyDatCho(req, res) {
        try {
            const maHKYeuCau = req.user.vaiTro === 'customer' ? req.user.maHK : null;
            await BookingService.huyDatCho(req.params.maPhieuDat, maHKYeuCau);
            res.json({ success: true, message: 'Huỷ đặt chỗ thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async lichSu(req, res) {
        try {
            const maHK = req.user.maHK;
            if (!maHK) return res.status(400).json({ success: false, message: 'Tài khoản không liên kết hành khách.' });
            const data = await BookingService.lichSu(maHK);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async getAllBookings(req, res) {
        try {
            const data = await BookingService.getAllBookings();
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async doanhThuThang(req, res) {
        try {
            const nam = parseInt(req.query.nam) || new Date().getFullYear();
            const data = await BookingService.doanhThuThang(nam);
            res.json({ success: true, data, nam });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async doanhThuChuyenBay(req, res) {
        try {
            const nam = parseInt(req.query.nam) || new Date().getFullYear();
            const thang = parseInt(req.query.thang) || new Date().getMonth() + 1;
            const data = await BookingService.doanhThuChuyenBay(nam, thang);
            res.json({ success: true, data, nam, thang });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },


    async xoaPhieuDat(req, res) {
    try {
        const { maPhieuDat } = req.params;
        const maHK = req.user.maHK;

        // Kiểm tra chủ sở hữu
        const [[phieu]] = await require('../config/database').pool.execute(
            'SELECT MaHK, TrangThai FROM PHIEUDATCHO WHERE MaPhieuDat = ?',
            [maPhieuDat]
        );
        if (!phieu) return res.status(404).json({ success: false, message: 'Phiếu không tồn tại.' });
        if (req.user.vaiTro === 'customer' && phieu.MaHK !== maHK) {
    return res.status(403).json({ success: false, message: 'Không có quyền xoá.' });
        }
        if (phieu.TrangThai === 'confirmed') return res.status(400).json({ success: false, message: 'Không thể xoá vé đã xác nhận.' });

        // Xoá vé nếu có
        await require('../config/database').pool.execute(
            'DELETE FROM VECHUYENBAY WHERE MaPhieuDat = ?', [maPhieuDat]
        );
        // Xoá phiếu
        await require('../config/database').pool.execute(
            'DELETE FROM PHIEUDATCHO WHERE MaPhieuDat = ?', [maPhieuDat]
        );

        res.json({ success: true, message: 'Xoá phiếu thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
},


async doanhThuNam(req, res) {
    try {
        const [rows] = await require('../config/database').pool.execute(
            `SELECT 
                YEAR(pdc.NgayDat) AS Nam,
                COUNT(pdc.MaPhieuDat) AS SoVe,
                SUM(pdc.GiaTien) AS DoanhThu
             FROM PHIEUDATCHO pdc
             WHERE pdc.TrangThai = 'confirmed'
             GROUP BY YEAR(pdc.NgayDat)
             ORDER BY Nam DESC`
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
},
};



module.exports = BookingController;
