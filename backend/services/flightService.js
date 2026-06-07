// services/flightService.js - Business logic cho chuyến bay
const FlightDAL = require('../dal/flightDAL');
const { pool } = require('../config/database');

/**
 * Lấy tham số hệ thống
 */
async function getThamSo(tenThamSo) {
    const [[row]] = await pool.execute(
        'SELECT GiaTri FROM THAMSO WHERE TenThamSo = ?', [tenThamSo]
    );
    return row ? row.GiaTri : null;
}

const FlightService = {
    async search(params) {
        return FlightDAL.getAll(params);
    },

    async getDetail(maChuyenBay) {
        const flight = await FlightDAL.getById(maChuyenBay);
        if (!flight) throw new Error('Chuyến bay không tồn tại.');
        return flight;
    },

    async create(data) {
        // Kiểm tra thời gian bay tối thiểu từ THAMSO
        const tgbToiThieu = await getThamSo('TGBToiThieu');
        if (tgbToiThieu && data.thoiGianBay < tgbToiThieu) {
            throw new Error(`Thời gian bay phải >= ${tgbToiThieu} phút (theo quy định).`);
        }

        // Kiểm tra chuyến bay trùng mã
        const existing = await FlightDAL.getById(data.maChuyenBay);
        if (existing) throw new Error('Mã chuyến bay đã tồn tại.');

        // Kiểm tra sân bay di/đến khác nhau
        if (data.maSanBayDi === data.maSanBayDen) {
            throw new Error('Sân bay đi và sân bay đến không được trùng nhau.');
        }

        await FlightDAL.create(data);

        // Thêm chi tiết hạng vé nếu có
        if (data.hangVe && Array.isArray(data.hangVe)) {
            for (const hv of data.hangVe) {
                await FlightDAL.upsertHangVe(data.maChuyenBay, hv.maHangVe, hv.slGhe);
            }
        }

        // Thêm sân bay trung gian nếu có
        if (data.sanBayTrungGian && Array.isArray(data.sanBayTrungGian)) {
            const soSBTGToiDa = await getThamSo('SoSanBayTGToiDa') || 2;
            if (data.sanBayTrungGian.length > soSBTGToiDa) {
                throw new Error(`Số sân bay trung gian tối đa là ${soSBTGToiDa}.`);
            }

            const tgdToiThieu = await getThamSo('TGDToiThieu') || 10;
            const tgdToiDa    = await getThamSo('TGDToiDa')    || 20;

const [[lastCT]] = await pool.execute(
    "SELECT MaCT FROM CT_SANBAYTRUNGGIAN ORDER BY MaCT DESC LIMIT 1"
);
        let maCTIndex = lastCT ? parseInt(lastCT.MaCT.replace('CT', '')) + 1 : 1;

        for (const tg of data.sanBayTrungGian) {
            if (tg.thoiGianDung < tgdToiThieu || tg.thoiGianDung > tgdToiDa) {
                throw new Error(`Thời gian dừng tại sân bay trung gian phải từ ${tgdToiThieu} đến ${tgdToiDa} phút.`);
            }
            const maCT = `CT${String(maCTIndex++).padStart(3, '0')}`;
            await FlightDAL.addTrungGian({
                maCT, thoiGianDung: tg.thoiGianDung,
                ghiChu: tg.ghiChu, maChuyenBay: data.maChuyenBay, maSanBay: tg.maSanBay
            });
        }
        }

        return FlightDAL.getById(data.maChuyenBay);
    },

async update(maChuyenBay, fields) {
    if (fields.thoiGianBay !== undefined) {
        const tgbToiThieu = await getThamSo('TGBToiThieu');
        if (tgbToiThieu && fields.thoiGianBay < tgbToiThieu) {
            throw new Error(`Thời gian bay phải >= ${tgbToiThieu} phút.`);
        }
    }

    const dbFields = {};
    if (fields.giaVe !== undefined)       dbFields.GiaVe = fields.giaVe;
    if (fields.ngayGio !== undefined)      dbFields.NgayGio = fields.ngayGio;
    if (fields.thoiGianBay !== undefined)  dbFields.ThoiGianBay = fields.thoiGianBay;
    if (fields.maSanBayDi !== undefined)   dbFields.MaSanBayDi = fields.maSanBayDi;
    if (fields.maSanBayDen !== undefined)  dbFields.MaSanBayDen = fields.maSanBayDen;

    if (Object.keys(dbFields).length > 0) {
        const updated = await FlightDAL.update(maChuyenBay, dbFields);
        if (!updated) throw new Error('Chuyến bay không tồn tại.');
    }

    // Cập nhật số ghế nếu có
    if (fields.hangVe && Array.isArray(fields.hangVe)) {
        for (const hv of fields.hangVe) {
            if (hv.slGhe > 0) {
                await FlightDAL.upsertHangVe(maChuyenBay, hv.maHangVe, hv.slGhe);
            }
        }
    }

    // Cập nhật sân bay trung gian nếu có
    if (fields.sanBayTrungGian !== undefined) {
        const soSBTGToiDa = await getThamSo('SoSanBayTGToiDa') || 2;
        if (fields.sanBayTrungGian.length > soSBTGToiDa) {
            throw new Error(`Số sân bay trung gian tối đa là ${soSBTGToiDa}.`);
        }

        const tgdToiThieu = await getThamSo('TGDToiThieu') || 10;
        const tgdToiDa    = await getThamSo('TGDToiDa')    || 20;

        // Xoá sân bay trung gian cũ
        await pool.execute(
            'DELETE FROM CT_SANBAYTRUNGGIAN WHERE MaChuyenBay = ?',
            [maChuyenBay]
        );

        // Thêm sân bay trung gian mới
        if (fields.sanBayTrungGian.length > 0) {
            const [[lastCT]] = await pool.execute(
                "SELECT MaCT FROM CT_SANBAYTRUNGGIAN ORDER BY MaCT DESC LIMIT 1"
            );
            let maCTIndex = lastCT ? parseInt(lastCT.MaCT.replace('CT', '')) + 1 : 1;

            for (const tg of fields.sanBayTrungGian) {
                if (tg.thoiGianDung < tgdToiThieu || tg.thoiGianDung > tgdToiDa) {
                    throw new Error(`Thời gian dừng phải từ ${tgdToiThieu} đến ${tgdToiDa} phút.`);
                }
                const maCT = `CT${String(maCTIndex++).padStart(3, '0')}`;
                await FlightDAL.addTrungGian({
                    maCT, thoiGianDung: tg.thoiGianDung,
                    ghiChu: tg.ghiChu || null,
                    maChuyenBay: maChuyenBay,
                    maSanBay: tg.maSanBay
                });
            }
        }
    }

    return FlightDAL.getById(maChuyenBay);
},

    async delete(maChuyenBay) {
        return FlightDAL.delete(maChuyenBay);
    },

    // ----- Sân bay -----
    async getAllAirports() {
        const [rows] = await pool.execute('SELECT * FROM SANBAY ORDER BY TenSanBay');
        return rows;
    },

    async addAirport(maSanBay, tenSanBay) {
        try {
            await pool.execute(
                'INSERT INTO SANBAY (MaSanBay, TenSanBay) VALUES (?, ?)',
                [maSanBay.toUpperCase(), tenSanBay]
            );
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') throw new Error('Mã sân bay đã tồn tại.');
            throw err;
        }
    },

    async updateAirport(maSanBay, tenSanBay) {
        const [result] = await pool.execute(
            'UPDATE SANBAY SET TenSanBay = ? WHERE MaSanBay = ?', [tenSanBay, maSanBay]
        );
        if (result.affectedRows === 0) throw new Error('Sân bay không tồn tại.');
    },

    async deleteAirport(maSanBay) {
        const [[{ count }]] = await pool.execute(
            'SELECT COUNT(*) as count FROM CHUYENBAY WHERE MaSanBayDi = ? OR MaSanBayDen = ?',
            [maSanBay, maSanBay]
        );
        if (count > 0) throw new Error('Không thể xoá sân bay đang được sử dụng trong chuyến bay.');
        await pool.execute('DELETE FROM SANBAY WHERE MaSanBay = ?', [maSanBay]);
    }
};

module.exports = FlightService;
