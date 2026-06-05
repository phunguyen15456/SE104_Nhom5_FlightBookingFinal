<<<<<<< HEAD
# ✈ SkyBooking – Hệ Thống Quản Lý Bán Vé Chuyến Bay

Ứng dụng web quản lý bán vé máy bay theo mô hình **Client–Server**, xây dựng bằng:
- **Frontend**: HTML5 + CSS3 + Vanilla JS
- **Backend**: Node.js + Express.js (RESTful API)
- **Database**: MySQL

---

## 📁 Cấu Trúc Dự Án

```
flight-booking/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js              # JWT authenticate + authorize
│   ├── dal/                     # Data Access Layer
│   │   ├── authDAL.js
│   │   ├── flightDAL.js
│   │   └── bookingDAL.js
│   ├── services/                # Business Logic Layer
│   │   ├── authService.js
│   │   ├── flightService.js
│   │   ├── bookingService.js
│   │   └── thamsoService.js
│   ├── controllers/             # Request Handlers
│   │   ├── authController.js
│   │   ├── flightController.js
│   │   ├── bookingController.js
│   │   └── thamsoController.js
│   ├── routes/
│   │   └── index.js             # Tất cả API routes
│   ├── server.js                # Express entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── css/
│   │   └── style.css            # Aviation theme
│   ├── js/
│   │   └── api.js               # API helper + Auth + Utilities
│   ├── pages/
│   │   ├── login.html           # Đăng nhập / Đăng ký
│   │   ├── flights.html         # Danh sách chuyến bay
│   │   ├── my-bookings.html     # Vé của khách hàng
│   │   ├── manager.html         # Dashboard Manager
│   │   └── admin.html           # Dashboard Admin
│   └── index.html               # Trang chủ
└── database/
    └── init.sql                 # Script tạo 9 bảng + dữ liệu mẫu
```

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu
- [Node.js LTS](https://nodejs.org/) (v18+)
- MySQL 8.0+ hoặc MariaDB 10.6+
- MySQL Workbench (hoặc bất kỳ GUI nào)

---

### Bước 1 – Khởi Tạo Database

1. Mở **MySQL Workbench** hoặc terminal MySQL
2. Tạo database mới:
   ```sql
   CREATE DATABASE flight_booking
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci;
   USE flight_booking;
   ```
3. Chạy file `database/init.sql` để tạo bảng và dữ liệu mẫu
4. **Quan trọng**: Cập nhật hash mật khẩu thực tế bằng cách chạy script dưới đây trong Node.js:

```js
// Chạy 1 lần để tạo hash và cập nhật DB
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function seedPasswords() {
  const pool = await mysql.createPool({ host:'localhost', user:'root', password:'your_pw', database:'flight_booking' });
  const users = [
    { maTK: 'TK001', password: 'Admin@123' },
    { maTK: 'TK002', password: 'Manager@123' },
    { maTK: 'TK003', password: 'Customer@123' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.execute('UPDATE TAIKHOAN SET MatKhau = ? WHERE MaTK = ?', [hash, u.maTK]);
  }
  console.log('✅ Đã cập nhật mật khẩu!');
  pool.end();
}
seedPasswords();
```

---

### Bước 2 – Cấu Hình Backend

```bash
cd backend
npm install
cp .env.example .env
```

Chỉnh sửa file `.env`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mật_khẩu_mysql_của_bạn
DB_NAME=flight_booking
JWT_SECRET=đổi_thành_chuỗi_bí_mật_dài_và_ngẫu_nhiên
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
```

---

### Bước 3 – Khởi Động Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Mở trình duyệt: **http://localhost:3000**

---

## 🔐 Tài Khoản Mặc Định

| Vai trò  | Tên đăng nhập | Mật khẩu      |
|----------|---------------|---------------|
| Admin    | `admin`       | `Admin@123`   |
| Manager  | `manager`     | `Manager@123` |
| Customer | `customer1`   | `Customer@123`|

---

## 🗺 Bản Đồ Tính Năng

### 👤 Customer
| Tính năng | Mô tả |
|-----------|-------|
| Tìm kiếm chuyến bay | Lọc theo sân bay, ngày, hạng vé |
| Xem chi tiết | Thông tin hạng vé, ghế trống, sân bay trung gian |
| Đặt chỗ | Giữ ghế tạm thời (pending) |
| Huỷ đặt chỗ | Hoàn ghế tự động |
| Lịch sử vé | Xem toàn bộ phiếu đặt |
| Đăng ký / Đăng nhập | Tài khoản cá nhân |

### 📋 Manager
| Tính năng | Mô tả |
|-----------|-------|
| Quản lý chuyến bay | Thêm / Sửa / Xoá với validation |
| Xuất vé | Chuyển phiếu pending → confirmed |
| Xem tất cả đặt vé | Lọc theo trạng thái |
| Báo cáo doanh thu | Theo tháng/năm + biểu đồ cột |
| Chi tiết theo chuyến bay | Doanh thu từng tuyến |

### 🔑 Admin
| Tính năng | Mô tả |
|-----------|-------|
| Quản lý tài khoản | Tạo / Khoá / Đổi vai trò |
| Quản lý sân bay | Thêm / Sửa / Xoá |
| Quản lý hạng vé | Thêm / Sửa / Xoá |
| Tham số hệ thống | Chỉnh TGBToiThieu, TGDToiThieu, v.v. |
| Lịch sử thay đổi | Log tự động mỗi khi sửa tham số |

---

## 📡 REST API Reference

### Auth
```
POST   /api/auth/login          Đăng nhập → JWT token
POST   /api/auth/register       Đăng ký tài khoản customer
POST   /api/auth/logout         Đăng xuất
GET    /api/auth/profile        Thông tin tài khoản (cần token)
PUT    /api/auth/password       Đổi mật khẩu
```

### Chuyến Bay & Sân Bay
```
GET    /api/flights             Tìm kiếm (public) ?maSBDi=&maSBDen=&ngayBay=
GET    /api/flights/:id         Chi tiết chuyến bay (public)
POST   /api/flights             Tạo chuyến bay [manager/admin]
PUT    /api/flights/:id         Cập nhật [manager/admin]
DELETE /api/flights/:id         Xoá [manager/admin]

GET    /api/airports            Danh sách sân bay (public)
POST   /api/airports            Thêm sân bay [admin]
PUT    /api/airports/:id        Sửa [admin]
DELETE /api/airports/:id        Xoá [admin]
```

### Đặt Vé
```
POST   /api/bookings            Đặt chỗ [customer]
POST   /api/bookings/:id/ticket Xuất vé [manager/admin]
DELETE /api/bookings/:id        Huỷ đặt chỗ [customer/manager/admin]
GET    /api/bookings/my         Lịch sử của tôi [customer]
GET    /api/bookings            Tất cả đặt vé [manager/admin]
```

### Báo Cáo
```
GET    /api/reports/revenue/monthly   Doanh thu theo tháng ?nam=2025
GET    /api/reports/revenue/flights   Chi tiết theo chuyến ?nam=2025&thang=8
```

### Tham Số & Hạng Vé
```
GET    /api/thamso              Danh sách tham số [admin]
PUT    /api/thamso/:id          Cập nhật + ghi log [admin]
GET    /api/thamso/logs         Lịch sử thay đổi [admin]

GET    /api/hangve              Danh sách hạng vé (public)
POST   /api/hangve              Thêm [admin]
PUT    /api/hangve/:id          Sửa [admin]
DELETE /api/hangve/:id          Xoá [admin]
```

---

## ⚙️ Tham Số Hệ Thống (THAMSO)

| Tên tham số       | Mặc định | Ý nghĩa |
|-------------------|----------|---------|
| TGBToiThieu       | 30 phút  | Thời gian bay tối thiểu |
| SoSanBayTGToiDa   | 2        | Số sân bay trung gian tối đa |
| TGDToiThieu       | 10 phút  | Thời gian dừng tối thiểu |
| TGDToiDa          | 20 phút  | Thời gian dừng tối đa |
| TGDatVeChamNhat   | 12 giờ   | Phải đặt vé trước khi bay bao nhiêu giờ |

---

## 🔒 Bảo Mật

- Mật khẩu băm bằng **bcrypt** (10 rounds)
- Xác thực API bằng **JWT Bearer Token**
- Phân quyền 3 cấp: `admin` → `manager` → `customer`
- **Transaction DB** khi đặt vé và huỷ (tránh race condition)
- Row-level lock (`FOR UPDATE`) khi kiểm tra ghế trống

---

## 🧪 Test Nhanh Bằng curl

```bash
# Đăng nhập
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenDangNhap":"admin","matKhau":"Admin@123"}'

# Tìm chuyến bay
curl http://localhost:3000/api/flights?maSBDi=SGN&maSBDen=HAN

# Đặt chỗ (cần token customer)
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"maChuyenBay":"CB001","maHangVe":"HV02"}'
```

---

## 📝 Ghi Chú Phát Triển

- Môi trường production nên dùng **HTTPS** + reverse proxy (nginx)
- JWT blacklist (Redis) nếu cần logout thực sự
- Thêm **rate limiting** (`express-rate-limit`) để chống brute-force
- Có thể nâng cấp DB lên **PostgreSQL** chỉ cần đổi driver
=======
# FlightBooking
>>>>>>> 94e4fe429bec4354757f347c83c66fb2125d68e8
