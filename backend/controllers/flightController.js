// controllers/flightController.js
const FlightService = require('../services/flightService');

const FlightController = {
    async search(req, res) {
        try {
            const { maSBDi, maSBDen, ngayBay, page = 1, limit = 10 } = req.query;
            const result = await FlightService.search({
                maSBDi, maSBDen, ngayBay,
                page: parseInt(page), limit: parseInt(limit)
            });
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async getDetail(req, res) {
        try {
            const flight = await FlightService.getDetail(req.params.maChuyenBay);
            res.json({ success: true, data: flight });
        } catch (err) {
            res.status(404).json({ success: false, message: err.message });
        }
    },

    async create(req, res) {
        try {
            const { maChuyenBay, giaVe, ngayGio, thoiGianBay, maSanBayDi, maSanBayDen, hangVe, sanBayTrungGian } = req.body;
            if (!maChuyenBay || !giaVe || !ngayGio || !thoiGianBay || !maSanBayDi || !maSanBayDen)
                return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });

            const result = await FlightService.create(req.body);
            res.status(201).json({ success: true, message: 'Tạo chuyến bay thành công.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async update(req, res) {
        try {
            const result = await FlightService.update(req.params.maChuyenBay, req.body);
            res.json({ success: true, message: 'Cập nhật thành công.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async delete(req, res) {
        try {
            await FlightService.delete(req.params.maChuyenBay);
            res.json({ success: true, message: 'Xoá chuyến bay thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    // Sân bay
    async getAirports(req, res) {
        try {
            const list = await FlightService.getAllAirports();
            res.json({ success: true, data: list });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async addAirport(req, res) {
        try {
            const { maSanBay, tenSanBay } = req.body;
            if (!maSanBay || !tenSanBay || maSanBay.length !== 3)
                return res.status(400).json({ success: false, message: 'Mã sân bay phải đúng 3 ký tự.' });
            await FlightService.addAirport(maSanBay, tenSanBay);
            res.status(201).json({ success: true, message: 'Thêm sân bay thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async updateAirport(req, res) {
        try {
            await FlightService.updateAirport(req.params.maSanBay, req.body.tenSanBay);
            res.json({ success: true, message: 'Cập nhật sân bay thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async deleteAirport(req, res) {
        try {
            await FlightService.deleteAirport(req.params.maSanBay);
            res.json({ success: true, message: 'Xoá sân bay thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
};

module.exports = FlightController;
