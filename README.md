# ĐỒ ÁN MÔN HỌC SE104

# HỆ THỐNG QUẢN LÝ BÁN VÉ CHUYẾN BAY (FLIGHTBOOKING)

## Giảng viên hướng dẫn

**TS. Huỳnh Ngọc Tín**

## Nhóm thực hiện

**Nhóm 5 – Lớp SE104.Q26**

| STT | Họ tên | MSSV |
|-----|---------|---------|
| 1 | Nguyễn Tấn Phát | 24521308 |
| 2 | Lý Hoài Phong | 24521334 |
| 3 | Lê Minh Phú | 24521354 |
| 4 | Nguyễn Bình Phú | 24521356 |

---

## Giới thiệu

FlightBooking là hệ thống quản lý bán vé chuyến bay được xây dựng nhằm hỗ trợ quản lý các hoạt động liên quan đến sân bay, chuyến bay, hạng vé, đặt chỗ, xuất vé và thống kê doanh thu. Hệ thống được phát triển theo mô hình ứng dụng Web với cơ chế phân quyền cho ba nhóm người dùng gồm Admin, Manager và Customer.

---

## Yêu cầu phần mềm cần cài đặt

Trước khi bắt đầu, cần cài đặt đầy đủ các phần mềm sau:

| Phần mềm | Link tải | Ghi chú |
|---|---|---|
| Node.js LTS | https://nodejs.org/ | Chọn bản LTS |
| MySQL 8.0 | https://dev.mysql.com/downloads/installer/ | Chọn mysql-installer-community |
| MySQL Workbench | https://dev.mysql.com/downloads/workbench/ | Công cụ quản lý cơ sở dữ liệu |
| Visual Studio Code | https://code.visualstudio.com/ | Trình soạn thảo mã nguồn |

---

## Công nghệ sử dụng

### Frontend

- HTML5
- CSS3
- JavaScript

### Backend

- Node.js
- ExpressJS

### Cơ sở dữ liệu

- MySQL Server 8.0

### Công cụ hỗ trợ

- Visual Studio Code
- Git
- GitHub
- MySQL Workbench
- Postman

---

## Kiến trúc hệ thống

Hệ thống được xây dựng theo mô hình Client – Server và tổ chức mã nguồn theo kiến trúc phân tầng gồm:

- Route Layer
- Controller Layer
- Service Layer
- Data Access Layer (DAL)
- Database Layer

Mô hình này giúp mã nguồn dễ bảo trì, dễ mở rộng và thuận tiện cho việc phát triển theo nhóm.

---

## Cấu trúc thư mục

```text
flight-booking/
├── database/
│   └── init.sql
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── dal/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── css/
    ├── js/
    ├── pages/
    └── index.html
```

### Backend

| Thư mục | Chức năng |
|----------|-----------|
| config | Cấu hình hệ thống và kết nối cơ sở dữ liệu |
| controllers | Xử lý request và response |
| services | Xử lý nghiệp vụ |
| dal | Truy xuất dữ liệu |
| middleware | Xác thực và phân quyền |
| routes | Định nghĩa API |
| server.js | Điểm khởi động hệ thống |

### Frontend

| Thư mục | Chức năng |
|----------|-----------|
| pages | Chứa các trang giao diện |
| css | Chứa mã định dạng giao diện |
| js | Chứa các đoạn mã xử lý phía client |

---

## Hướng dẫn cài đặt

### Bước 1. Cài đặt MySQL

1. Chạy MySQL Installer.
2. Chọn cài đặt MySQL Server 8.0 và MySQL Workbench.
3. Thiết lập mật khẩu cho tài khoản root.
4. Hoàn tất quá trình cài đặt.

Kiểm tra dịch vụ MySQL:

```text
Windows + R
services.msc
```

Đảm bảo dịch vụ MySQL80 đang ở trạng thái Running.

---

### Bước 2. Tạo Database

Mở MySQL Workbench và thực hiện:

```sql
CREATE DATABASE flight_booking
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE flight_booking;
```

Sau đó mở file:

```text
database/init.sql
```

và thực thi toàn bộ script.

---

### Bước 3. Cấu hình môi trường

Đổi tên file:

```text
backend/.env.example
```

thành:

```text
backend/.env
```

Sau đó cấu hình:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=flight_booking

JWT_SECRET=flightbooking_secret_key_2025
JWT_EXPIRES_IN=24h

BCRYPT_ROUNDS=10
```

---

### Bước 4. Cài đặt thư viện

Mở Terminal:

```bash
cd backend
npm install
```

---

### Bước 5. Khởi tạo mật khẩu tài khoản mẫu

```bash
node seedPassword.js
```

Kết quả:

```text
TK001 done
TK002 done
TK003 done
```

---

### Bước 6. Khởi động hệ thống

```bash
npm run dev
```

Nếu thành công:

```text
Kết nối Database thành công!
Server đang chạy tại http://localhost:3000
```

---

## Tài khoản mặc định

| Vai trò | Tên đăng nhập | Mật khẩu |
|----------|---------------|-----------|
| Admin | admin | Admin@123 |
| Manager | manager | Manager@123 |
| Customer | customer1 | Customer@123 |

---

## Chức năng hệ thống

### Customer

- Đăng ký tài khoản
- Đăng nhập hệ thống
- Tìm kiếm chuyến bay
- Đặt chỗ chuyến bay
- Chỉnh sửa phiếu đặt chỗ
- Hủy phiếu đặt chỗ
- Xem lịch sử đặt vé

### Manager

- Quản lý chuyến bay
- Quản lý sân bay trung gian
- Quản lý đặt vé
- Xuất vé
- Xem báo cáo doanh thu theo tháng
- Xem báo cáo doanh thu theo năm

### Admin

- Quản lý tài khoản
- Phân quyền người dùng
- Quản lý sân bay
- Quản lý hạng vé
- Cập nhật tham số hệ thống
- Theo dõi lịch sử thay đổi quy định

---

## Quy trình phát triển

Nhóm áp dụng mô hình phát triển phần mềm Waterfall gồm các giai đoạn:

1. Khảo sát
2. Phân tích yêu cầu
3. Thiết kế hệ thống
4. Hiện thực
5. Kiểm thử

---

## Giấy phép

Dự án được phát triển phục vụ mục đích học tập trong học phần SE104 – Nhập môn Công nghệ Phần mềm, Trường Đại học Công nghệ Thông tin – Đại học Quốc gia Thành phố Hồ Chí Minh.
