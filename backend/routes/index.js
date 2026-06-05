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

router.post  ('/flights',                authenticate, authorize('manager','admin'), FlightController.create);
router.put   ('/flights/:maChuyenBay',   authenticate, authorize('manager','admin'), FlightController.update);
router.delete('/flights/:maChuyenBay',   authenticate, authorize('manager','admin'), FlightController.delete);

// Sân bay
router.get   ('/airports',           FlightController.getAirports); // Public
router.post  ('/airports',           authenticate, authorize('admin'), FlightController.addAirport);
router.put   ('/airports/:maSanBay', authenticate, authorize('admin'), FlightController.updateAirport);
router.delete('/airports/:maSanBay', authenticate, authorize('admin'), FlightController.deleteAirport);

// ============================================================
// BOOKING ROUTES
// ============================================================
router.post('/bookings',                    authenticate, authorize('customer'), BookingController.datCho);
router.post('/bookings/:maPhieuDat/ticket', authenticate, authorize('manager','admin'), BookingController.xuatVe);
router.delete('/bookings/:maPhieuDat',      authenticate, BookingController.huyDatCho);
router.delete('/bookings/:maPhieuDat/delete', authenticate, authorize('customer'), BookingController.xoaPhieuDat);
router.get('/bookings/my',                  authenticate, authorize('customer'), BookingController.lichSu);
router.get('/bookings',                     authenticate, authorize('manager','admin'), BookingController.getAllBookings);

// ============================================================
// REPORT ROUTES
// ============================================================
router.get('/reports/revenue/monthly',  authenticate, authorize('manager','admin'), BookingController.doanhThuThang);
router.get('/reports/revenue/flights',  authenticate, authorize('manager','admin'), BookingController.doanhThuChuyenBay);

// ============================================================
// THAM SO & HANG VE ROUTES (Admin)
// ============================================================
router.get('/thamso',          authenticate, authorize('admin'), ThamSoController.getAll);
router.put('/thamso/:maThamSo',authenticate, authorize('admin'), ThamSoController.update);
router.get('/thamso/logs',     authenticate, authorize('admin'), ThamSoController.getLogs);

router.get   ('/hangve',             ThamSoController.getHangVe); // Public
router.post  ('/hangve',             authenticate, authorize('admin'), ThamSoController.addHangVe);
router.put   ('/hangve/:maHangVe',   authenticate, authorize('admin'), ThamSoController.updateHangVe);
router.delete('/hangve/:maHangVe',   authenticate, authorize('admin'), ThamSoController.deleteHangVe);



router.get('/reports/revenue/yearly', authenticate, authorize('manager','admin'), BookingController.doanhThuNam);

module.exports = router;
