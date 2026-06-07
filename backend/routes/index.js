// routes/index.js - Tất cả route definitions
const express = require('express');
const router = express.Router();

const AuthController    = require('../controllers/authController');
const FlightController  = require('../controllers/flightController');
const BookingController = require('../controllers/bookingController');
const ThamSoController  = require('../controllers/thamsoController');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// AUTH ROUTES
// ============================================================
router.post('/auth/login',    AuthController.login);
router.post('/auth/register', AuthController.register);
router.post('/auth/logout',   authenticate, AuthController.logout);
router.get ('/auth/profile',  authenticate, AuthController.getProfile);
router.put ('/auth/password', authenticate, AuthController.changePassword);

// Admin: quản lý tài khoản
router.get ('/admin/accounts',            authenticate, authorize('admin'), AuthController.getAllAccounts);
router.post('/admin/accounts/staff',      authenticate, authorize('admin'), AuthController.createStaff);
router.put ('/admin/accounts/:maTK/role', authenticate, authorize('admin'), AuthController.updateRole);
router.delete('/admin/accounts/:maTK',   authenticate, authorize('admin'), AuthController.deactivateAccount);

// ============================================================
// FLIGHT & AIRPORT ROUTES
// ============================================================
router.get('/flights',        FlightController.search);      // Public
router.get('/flights/:maChuyenBay', FlightController.getDetail); // Public

router.post  ('/flights',                authenticate, authorize('manager'), FlightController.create);
router.put   ('/flights/:maChuyenBay',   authenticate, authorize('manager'), FlightController.update);
router.delete('/flights/:maChuyenBay',   authenticate, authorize('manager'), FlightController.delete);

// Sân bay
router.get   ('/airports',           FlightController.getAirports); // Public
router.post  ('/airports',           authenticate, authorize('admin'), FlightController.addAirport);
router.put   ('/airports/:maSanBay', authenticate, authorize('admin'), FlightController.updateAirport);
router.delete('/airports/:maSanBay', authenticate, authorize('admin'), FlightController.deleteAirport);

// ============================================================
// BOOKING ROUTES
// ============================================================
router.post('/bookings',                    authenticate, authorize('customer'), BookingController.datCho);
router.post('/bookings/:maPhieuDat/ticket', authenticate, authorize('manager'), BookingController.xuatVe);
router.delete('/bookings/:maPhieuDat',      authenticate, BookingController.huyDatCho);
router.delete('/bookings/:maPhieuDat/delete', authenticate, authorize('customer', 'manager'), BookingController.xoaPhieuDat);
router.get('/bookings/my',                  authenticate, authorize('customer'), BookingController.lichSu);
router.get('/bookings',                     authenticate, authorize('manager'), BookingController.getAllBookings);

// ============================================================
// REPORT ROUTES
// ============================================================
router.get('/reports/revenue/monthly',  authenticate, authorize('manager'), BookingController.doanhThuThang);
router.get('/reports/revenue/flights',  authenticate, authorize('manager'), BookingController.doanhThuChuyenBay);

// ============================================================
// THAM SO & HANG VE ROUTES (Admin)
// ============================================================
router.get('/thamso',          authenticate, authorize('admin','manager'), ThamSoController.getAll);
router.put('/thamso/:maThamSo',authenticate, authorize('admin'), ThamSoController.update);
router.get('/thamso/logs',     authenticate, authorize('admin'), ThamSoController.getLogs);

router.get   ('/hangve',             ThamSoController.getHangVe); // Public
router.post  ('/hangve',             authenticate, authorize('admin'), ThamSoController.addHangVe);
router.put   ('/hangve/:maHangVe',   authenticate, authorize('admin'), ThamSoController.updateHangVe);
router.delete('/hangve/:maHangVe',   authenticate, authorize('admin'), ThamSoController.deleteHangVe);



router.get('/reports/revenue/yearly', authenticate, authorize('manager'), BookingController.doanhThuNam);



router.put('/bookings/:maPhieuDat/edit', authenticate, authorize('manager','customer'), async (req, res) => {
    try {
        const { maPhieuDat } = req.params;
        const { maChuyenBay, maHangVe } = req.body;
        const { pool } = require('../config/database');

        const [[phieu]] = await pool.execute(
            'SELECT * FROM PHIEUDATCHO WHERE MaPhieuDat = ? AND TrangThai = ?',
            [maPhieuDat, 'pending']
        );
        if (!phieu) return res.status(400).json({ success: false, message: 'Chỉ sửa được phiếu đang chờ xử lý.' });

        // Hoàn ghế cũ
        await pool.execute(
            'UPDATE CHITIETHANGVE SET SLGheConLai = SLGheConLai + 1 WHERE MaChuyenBay = ? AND MaHangVe = ?',
            [phieu.MaChuyenBay, phieu.MaHangVe]
        );

        // Kiểm tra ghế mới
        const [[newSeat]] = await pool.execute(
            'SELECT SLGheConLai, cb.GiaVe, hv.TiLe FROM CHITIETHANGVE cthv JOIN CHUYENBAY cb ON cthv.MaChuyenBay = cb.MaChuyenBay JOIN HANGVE hv ON cthv.MaHangVe = hv.MaHangVe WHERE cthv.MaChuyenBay = ? AND cthv.MaHangVe = ?',
            [maChuyenBay, maHangVe]
        );
        if (!newSeat || newSeat.SLGheConLai <= 0) {
            // Hoàn lại ghế cũ
            await pool.execute(
                'UPDATE CHITIETHANGVE SET SLGheConLai = SLGheConLai - 1 WHERE MaChuyenBay = ? AND MaHangVe = ?',
                [phieu.MaChuyenBay, phieu.MaHangVe]
            );
            return res.status(400).json({ success: false, message: 'Không còn ghế trống.' });
        }

        // Trừ ghế mới
        await pool.execute(
            'UPDATE CHITIETHANGVE SET SLGheConLai = SLGheConLai - 1 WHERE MaChuyenBay = ? AND MaHangVe = ?',
            [maChuyenBay, maHangVe]
        );

        // Tính giá mới
        const giaMoi = Math.round(newSeat.GiaVe * newSeat.TiLe / 100);

        // Cập nhật phiếu
        await pool.execute(
            'UPDATE PHIEUDATCHO SET MaChuyenBay = ?, MaHangVe = ?, GiaTien = ? WHERE MaPhieuDat = ?',
            [maChuyenBay, maHangVe, giaMoi, maPhieuDat]
        );

        res.json({ success: true, message: 'Cập nhật thành công.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
