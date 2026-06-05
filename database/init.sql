vechuyenbaychitiethangve-- ============================================================
-- HỆ THỐNG QUẢN LÝ BÁN VÉ CHUYẾN BAY
-- Database Initialization Script (MySQL/PostgreSQL compatible)
-- ============================================================

-- Nếu dùng MySQL: CREATE DATABASE flight_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE flight_booking;

-- ============================================================
-- BẢNG THAMSO (Tham số hệ thống)
-- ============================================================
CREATE TABLE THAMSO (
    MaThamSo    CHAR(5)      NOT NULL,
    TenThamSo   VARCHAR(50)  NOT NULL,
    GiaTri      INT          NOT NULL,
    CONSTRAINT PK_THAMSO PRIMARY KEY (MaThamSo)
);

-- ============================================================
-- BẢNG SANBAY
-- ============================================================
CREATE TABLE SANBAY (
    MaSanBay    CHAR(3)      NOT NULL,
    TenSanBay   NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_SANBAY PRIMARY KEY (MaSanBay)
);

-- ============================================================
-- BẢNG CHUYENBAY
-- ============================================================
CREATE TABLE CHUYENBAY (
    MaChuyenBay   CHAR(5)    NOT NULL,
    GiaVe         DECIMAL(18,2) NOT NULL,
    NgayGio       DATETIME   NOT NULL,
    ThoiGianBay   INT        NOT NULL,
    MaSanBayDi    CHAR(3)    NOT NULL,
    MaSanBayDen   CHAR(3)    NOT NULL,
    CONSTRAINT PK_CHUYENBAY PRIMARY KEY (MaChuyenBay),
    CONSTRAINT FK_CB_SBDi   FOREIGN KEY (MaSanBayDi) REFERENCES SANBAY(MaSanBay),
    CONSTRAINT FK_CB_SBDen  FOREIGN KEY (MaSanBayDen) REFERENCES SANBAY(MaSanBay),
    CONSTRAINT CK_CB_ThoiGianBay CHECK (ThoiGianBay >= 0),
    CONSTRAINT CK_CB_GiaVe CHECK (GiaVe > 0),
    CONSTRAINT CK_CB_DiKhacDen CHECK (MaSanBayDi <> MaSanBayDen)
);

-- ============================================================
-- BẢNG CT_SANBAYTRUNGGIAN
-- ============================================================
CREATE TABLE CT_SANBAYTRUNGGIAN (
    MaCT          CHAR(5)     NOT NULL,
    ThoiGianDung  INT         NOT NULL,
    GhiChu        NVARCHAR(255),
    MaChuyenBay   CHAR(5)     NOT NULL,
    MaSanBay      CHAR(3)     NOT NULL,
    CONSTRAINT PK_CTSBTG    PRIMARY KEY (MaCT),
    CONSTRAINT FK_CTSBTG_CB FOREIGN KEY (MaChuyenBay) REFERENCES CHUYENBAY(MaChuyenBay),
    CONSTRAINT FK_CTSBTG_SB FOREIGN KEY (MaSanBay)    REFERENCES SANBAY(MaSanBay),
    CONSTRAINT CK_CTSBTG_TGD CHECK (ThoiGianDung >= 0)
);

-- ============================================================
-- BẢNG HANGVE
-- ============================================================
CREATE TABLE HANGVE (
    MaHangVe    CHAR(4)      NOT NULL,
    TenHangVe   NVARCHAR(50) NOT NULL,
    TiLe        INT          NOT NULL DEFAULT 100,
    CONSTRAINT PK_HANGVE  PRIMARY KEY (MaHangVe),
    CONSTRAINT CK_HV_TiLe CHECK (TiLe > 0)
);

-- ============================================================
-- BẢNG CHITIETHANGVE (Composite PK, không dùng surrogate key)
-- ============================================================
CREATE TABLE CHITIETHANGVE (
    MaChuyenBay   CHAR(5) NOT NULL,
    MaHangVe      CHAR(4) NOT NULL,
    SLGhe         INT     NOT NULL DEFAULT 0,
    SLGheConLai   INT     NOT NULL DEFAULT 0,
    CONSTRAINT PK_CTHV         PRIMARY KEY (MaChuyenBay, MaHangVe),
    CONSTRAINT FK_CTHV_CB      FOREIGN KEY (MaChuyenBay) REFERENCES CHUYENBAY(MaChuyenBay),
    CONSTRAINT FK_CTHV_HV      FOREIGN KEY (MaHangVe)    REFERENCES HANGVE(MaHangVe),
    CONSTRAINT CK_CTHV_SLGhe   CHECK (SLGhe >= 0),
    CONSTRAINT CK_CTHV_SLConLai CHECK (SLGheConLai >= 0)
);

-- ============================================================
-- BẢNG HANHKHACH
-- ============================================================
CREATE TABLE HANHKHACH (
    MaHK            CHAR(5)      NOT NULL,
    TenHanhKhach    NVARCHAR(100) NOT NULL,
    CMND            CHAR(12)     NOT NULL,
    SoDT            VARCHAR(15),
    CONSTRAINT PK_HANHKHACH   PRIMARY KEY (MaHK),
    CONSTRAINT UQ_HK_CMND     UNIQUE (CMND)
);

-- ============================================================
-- BẢNG TAIKHOAN (Quản lý xác thực, không có trong đề nhưng cần thiết)
-- ============================================================
CREATE TABLE TAIKHOAN (
    MaTK        CHAR(5)      NOT NULL,
    TenDangNhap VARCHAR(50)  NOT NULL,
    MatKhau     VARCHAR(255) NOT NULL,  -- bcrypt hash
    VaiTro      VARCHAR(20)  NOT NULL DEFAULT 'customer',  -- admin/manager/customer
    MaHK        CHAR(5),
    NgayTao     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai   TINYINT      NOT NULL DEFAULT 1,
    CONSTRAINT PK_TAIKHOAN  PRIMARY KEY (MaTK),
    CONSTRAINT UQ_TK_TDN    UNIQUE (TenDangNhap),
    CONSTRAINT FK_TK_HK     FOREIGN KEY (MaHK) REFERENCES HANHKHACH(MaHK),
    CONSTRAINT CK_TK_VaiTro CHECK (VaiTro IN ('admin','manager','customer'))
);

-- ============================================================
-- BẢNG PHIEUDATCHO
-- ============================================================
CREATE TABLE PHIEUDATCHO (
    MaPhieuDat  CHAR(5)       NOT NULL,
    GiaTien     DECIMAL(18,2) NOT NULL,
    NgayDat     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TrangThai   VARCHAR(20)   NOT NULL DEFAULT 'pending',  -- pending/confirmed/cancelled
    MaHK        CHAR(5)       NOT NULL,
    MaChuyenBay CHAR(5)       NOT NULL,
    MaHangVe    CHAR(4)       NOT NULL,
    CONSTRAINT PK_PDC      PRIMARY KEY (MaPhieuDat),
    CONSTRAINT FK_PDC_HK   FOREIGN KEY (MaHK)        REFERENCES HANHKHACH(MaHK),
    CONSTRAINT FK_PDC_CB   FOREIGN KEY (MaChuyenBay) REFERENCES CHUYENBAY(MaChuyenBay),
    CONSTRAINT FK_PDC_HV   FOREIGN KEY (MaHangVe)    REFERENCES HANGVE(MaHangVe),
    CONSTRAINT CK_PDC_GT   CHECK (GiaTien > 0),
    CONSTRAINT CK_PDC_TS   CHECK (TrangThai IN ('pending','confirmed','cancelled'))
);

-- ============================================================
-- BẢNG VECHUYENBAY
-- ============================================================
CREATE TABLE VECHUYENBAY (
    MaVe        CHAR(5) NOT NULL,
    MaPhieuDat  CHAR(5) NOT NULL,
    NgayXuatVe  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_VCB       PRIMARY KEY (MaVe),
    CONSTRAINT FK_VCB_PDC   FOREIGN KEY (MaPhieuDat) REFERENCES PHIEUDATCHO(MaPhieuDat),
    CONSTRAINT UQ_VCB_PDC   UNIQUE (MaPhieuDat)
);

-- ============================================================
-- BẢNG LOG_THAMSO (Ghi log thay đổi quy định)
-- ============================================================
CREATE TABLE LOG_THAMSO (
    MaLog       INT          NOT NULL AUTO_INCREMENT,
    MaThamSo    CHAR(5)      NOT NULL,
    GiaTriCu    INT,
    GiaTriMoi   INT          NOT NULL,
    NguoiSua    VARCHAR(50)  NOT NULL,
    ThoiGian    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT PK_LOG PRIMARY KEY (MaLog)
);

-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

-- Tham số hệ thống
INSERT INTO THAMSO VALUES
('TS001', 'TGBToiThieu',        30),   -- Thời gian bay tối thiểu (phút)
('TS002', 'SoSanBayTGToiDa',    2),    -- Số sân bay trung gian tối đa
('TS003', 'TGDToiThieu',        10),   -- Thời gian dừng tối thiểu (phút)
('TS004', 'TGDToiDa',           20),   -- Thời gian dừng tối đa (phút) - Đã sửa thành 20 phút theo đề
('TS005', 'TGDatVeChamNhat',    12);   -- Giờ trước khi bay phải đặt vé

-- Sân bay
INSERT INTO SANBAY VALUES
('SGN', N'Tân Sơn Nhất - TP. Hồ Chí Minh'),
('HAN', N'Nội Bài - Hà Nội'),
('DAD', N'Đà Nẵng'),
('HPH', N'Cát Bi - Hải Phòng'),
('PQC', N'Phú Quốc'),
('VCA', N'Cần Thơ'),
('CXR', N'Cam Ranh - Khánh Hòa'),
('DLI', N'Liên Khương - Đà Lạt');

-- Hạng vé
INSERT INTO HANGVE VALUES
('HV01', N'Hạng Thương Gia', 150),
('HV02', N'Hạng Phổ Thông',   100),
('HV03', N'Hạng Tiết Kiệm',    80);

-- Chuyến bay mẫu
INSERT INTO CHUYENBAY VALUES
('CB001', 1500000, '2025-08-15 06:00:00', 120, 'SGN', 'HAN'),
('CB002', 1200000, '2025-08-15 08:30:00', 90,  'HAN', 'SGN'),
('CB003', 800000,  '2025-08-16 10:00:00', 60,  'SGN', 'DAD'),
('CB004', 950000,  '2025-08-17 14:00:00', 75,  'DAD', 'HAN'),
('CB005', 600000,  '2025-08-18 07:00:00', 55,  'SGN', 'PQC');

-- Chi tiết hạng vé cho từng chuyến bay
INSERT INTO CHITIETHANGVE VALUES
('CB001','HV01', 20, 20),
('CB001','HV02', 80, 80),
('CB001','HV03', 50, 50),
('CB002','HV01', 20, 20),
('CB002','HV02', 80, 80),
('CB002','HV03', 50, 50),
('CB003','HV01', 15, 15),
('CB003','HV02', 60, 60),
('CB003','HV03', 40, 40),
('CB004','HV01', 15, 15),
('CB004','HV02', 60, 60),
('CB004','HV03', 40, 40),
('CB005','HV01', 10, 10),
('CB005','HV02', 50, 50),
('CB005','HV03', 30, 30);

-- Hành khách mẫu
INSERT INTO HANHKHACH VALUES
('HK001', N'Nguyễn Văn An',   '001234567890', '0901234567'),
('HK002', N'Trần Thị Bình',   '002345678901', '0912345678'),
('HK003', N'Lê Minh Cường',   '003456789012', '0923456789');

-- Tài khoản mẫu (mật khẩu: Admin@123, Manager@123, Customer@123 - sẽ hash bằng bcrypt khi chạy)
-- Lưu ý: Trong production, hash password bằng bcrypt trước khi INSERT
INSERT INTO TAIKHOAN (MaTK, TenDangNhap, MatKhau, VaiTro, MaHK) VALUES
('TK001', 'admin',    '$2b$10$placeholder_admin_hash',    'admin',    NULL),
('TK002', 'manager',  '$2b$10$placeholder_manager_hash',  'manager',  NULL),
('TK003', 'customer1','$2b$10$placeholder_customer_hash', 'customer', 'HK001');




USE flight_booking;

UPDATE TAIKHOAN SET TrangThai = 1 WHERE TenDangNhap = 'customer1';
