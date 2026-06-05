// controllers/authController.js
const AuthService = require('../services/authService');
const AuthDAL = require('../dal/authDAL');

const AuthController = {
    async login(req, res) {
        try {
            const { tenDangNhap, matKhau } = req.body;
            if (!tenDangNhap || !matKhau)
                return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin.' });

            const result = await AuthService.login(tenDangNhap, matKhau);
            res.json({ success: true, message: 'Đăng nhập thành công.', data: result });
        } catch (err) {
            res.status(401).json({ success: false, message: err.message });
        }
    },

    async register(req, res) {
        try {
            const { tenDangNhap, matKhau, tenHanhKhach, cmnd, soDT } = req.body;
            if (!tenDangNhap || !matKhau || !tenHanhKhach || !cmnd)
                return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin bắt buộc.' });

            if (matKhau.length < 6)
                return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự.' });

            const result = await AuthService.register({ tenDangNhap, matKhau, tenHanhKhach, cmnd, soDT });
            res.status(201).json({ success: true, message: 'Đăng ký thành công.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async logout(req, res) {
        // JWT stateless - client xoá token. Server có thể dùng blacklist nếu cần.
        res.json({ success: true, message: 'Đăng xuất thành công.' });
    },

    async getProfile(req, res) {
        try {
            const tk = await AuthDAL.findByUsername(req.user.tenDangNhap);
            if (!tk) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
            const { MatKhau, ...safeData } = tk;
            res.json({ success: true, data: safeData });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async changePassword(req, res) {
        try {
            const { matKhauCu, matKhauMoi } = req.body;
            if (!matKhauCu || !matKhauMoi)
                return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ.' });
            if (matKhauMoi.length < 6)
                return res.status(400).json({ success: false, message: 'Mật khẩu mới phải >= 6 ký tự.' });

            await AuthService.changePassword(req.user.maTK, matKhauCu, matKhauMoi);
            res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    // Admin only
    async getAllAccounts(req, res) {
        try {
            const list = await AuthDAL.getAll();
            const safe = list.map(({ MatKhau, ...rest }) => rest);
            res.json({ success: true, data: safe });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async createStaff(req, res) {
        try {
            const result = await AuthService.createStaff(req.body);
            res.status(201).json({ success: true, message: 'Tạo tài khoản thành công.', data: result });
        } catch (err) {
            res.status(400).json({ success: false, message: err.message });
        }
    },

    async updateRole(req, res) {
        try {
            const { maTK } = req.params;
            const { vaiTro } = req.body;
            if (!['admin', 'manager', 'customer'].includes(vaiTro))
                return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });

            const ok = await AuthDAL.updateRole(maTK, vaiTro);
            if (!ok) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
            res.json({ success: true, message: 'Cập nhật vai trò thành công.' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    },

    async deactivateAccount(req, res) {
        try {
            const { maTK } = req.params;
            if (maTK === req.user.maTK)
                return res.status(400).json({ success: false, message: 'Không thể vô hiệu hoá tài khoản của chính mình.' });

            const ok = await AuthDAL.deactivate(maTK);
            if (!ok) return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại.' });
            res.json({ success: true, message: 'Vô hiệu hoá tài khoản thành công.' });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
};

module.exports = AuthController;
