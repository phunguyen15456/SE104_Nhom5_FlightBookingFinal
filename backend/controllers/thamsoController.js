// controllers/thamsoController.js
const ThamSoService = require('../services/thamsoService');

const ThamSoController = {
    async getAll(req, res) {
        try {
            const data = await ThamSoService.getAll();
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async update(req, res) {
        try {
            const { maThamSo } = req.params;
            const { giaTri } = req.body;
            if (giaTri === undefined || isNaN(giaTri))
                return res.status(400).json({ success: false, message: 'Giá trị tham số không hợp lệ.' });

            await ThamSoService.update(maThamSo, parseInt(giaTri), req.user.tenDangNhap);
            res.json({ success: true, message: 'Cập nhật tham số thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async getLogs(req, res) {
        try {
            const data = await ThamSoService.getLogs();
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    // Hạng vé
    async getHangVe(req, res) {
        try {
            const data = await ThamSoService.getAllHangVe();
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async addHangVe(req, res) {
        try {
            const { maHangVe, tenHangVe, tiLe } = req.body;
            if (!maHangVe || !tenHangVe || !tiLe)
                return res.status(400).json({ success: false, message: 'Thiếu thông tin hạng vé.' });
            await ThamSoService.addHangVe(maHangVe, tenHangVe, parseInt(tiLe));
            res.status(201).json({ success: true, message: 'Thêm hạng vé thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async updateHangVe(req, res) {
        try {
            const { maHangVe } = req.params;
            const { tenHangVe, tiLe } = req.body;
            await ThamSoService.updateHangVe(maHangVe, tenHangVe, parseInt(tiLe));
            res.json({ success: true, message: 'Cập nhật hạng vé thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async deleteHangVe(req, res) {
        try {
            await ThamSoService.deleteHangVe(req.params.maHangVe);
            res.json({ success: true, message: 'Xoá hạng vé thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    }
};

module.exports = ThamSoController;
