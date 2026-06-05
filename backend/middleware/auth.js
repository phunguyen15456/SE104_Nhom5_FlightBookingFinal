// middleware/auth.js - Xác thực JWT và phân quyền
const jwt = require('jsonwebtoken');

/**
 * Xác thực JWT token
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Yêu cầu xác thực. Vui lòng đăng nhập.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
        }
        return res.status(403).json({ success: false, message: 'Token không hợp lệ.' });
    }
};

/**
 * Phân quyền theo vai trò
 * @param {...string} roles - Danh sách vai trò được phép truy cập
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Chưa xác thực.' });
        }
        if (!roles.includes(req.user.vaiTro)) {
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
