# FlightBooking – Hệ Thống Quản Lý Bán Vé Chuyến Bay

## Yêu cầu phần mềm cần cài đặt

Trước khi bắt đầu, cài đặt đầy đủ 4 phần mềm sau:

| Phần mềm | Link tải | Ghi chú |
|---|---|---|
| Node.js LTS | https://nodejs.org/ | Chọn bản **LTS** |
| MySQL 8.0 | https://dev.mysql.com/downloads/installer/ | Chọn **mysql-installer-community** |
| MySQL Workbench | https://dev.mysql.com/downloads/workbench/ | Công cụ quản lý database |
| Visual Studio Code | https://code.visualstudio.com/ | Trình soạn thảo code |

---

## Bước 1 — Cài đặt MySQL

1. Chạy file **MySQL Installer** vừa tải về
2. Chọn cài **MySQL Server 8.0** + **MySQL Workbench**
3. Trong bước **Accounts and Roles**, đặt mật khẩu cho tài khoản `root`
   - Ví dụ: `Root@123`
   - **Nhớ mật khẩu này** — sẽ dùng ở các bước sau
4. Các bước còn lại nhấn **Next** → **Execute** → **Finish**

Kiểm tra MySQL đã chạy chưa:
- Nhấn **Windows + R** → gõ `services.msc` → tìm **MySQL80** → đảm bảo trạng thái là **Running**

---

## Bước 2 — Tải source code về máy

Tạo thư mục project và sắp xếp file theo cấu trúc sau:

```
flight-booking/
├── database/
│   └── init.sql
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── dal/
│   │   ├── authDAL.js
│   │   ├── flightDAL.js
│   │   └── bookingDAL.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── flightService.js
│   │   ├── bookingService.js
│   │   └── thamsoService.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── flightController.js
│   │   ├── bookingController.js
│   │   └── thamsoController.js
│   ├── routes/
│   │   └── index.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── css/
    │   └── style.css
    ├── js/
    │   └── api.js
    ├── pages/
    │   ├── login.html
    │   ├── register.html
    │   ├── flights.html
    │   ├── my-bookings.html
    │   ├── manager.html
    │   └── admin.html
    └── index.html
```

---

## Bước 3 — Tạo Database

1. Mở **MySQL Workbench**
2. Nhấn vào **Local instance MySQL** → nhập mật khẩu root → **OK**
3. Mở tab **Query**, chạy lệnh sau để tạo database:

```sql
CREATE DATABASE flight_booking
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE flight_booking;
```

4. Nhấn **File → Open SQL Script** → chọn file `database/init.sql`
5. Nhấn **⚡ Execute** (hoặc **Ctrl + Shift + Enter**)
6. Kiểm tra bên trái: **Schemas → flight_booking → Tables** thấy đủ 9 bảng là thành công

---

## Bước 4 — Cấu hình Backend

### 4.1 Tạo file `.env`

Vào thư mục `backend`, tìm file `.env.example` → đổi tên thành `.env`

Mở file `.env` và điền thông tin:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mật_khẩu_mysql_bạn_đặt_ở_bước_1
DB_NAME=flight_booking

JWT_SECRET=flightbooking_secret_key_2025
JWT_EXPIRES_IN=24h

BCRYPT_ROUNDS=10
```

### 4.2 Cài thư viện Node.js

Mở **Command Prompt** hoặc **Terminal trong VS Code**, chạy:

```cmd
cd C:\đường_dẫn_đến_thư_mục\flight-booking\backend
npm install
```

Chờ khoảng 1–2 phút. Thấy thư mục `node_modules` xuất hiện là xong.

---

## Bước 5 — Tạo mật khẩu cho tài khoản mẫu

Tạo file `seedPassword.js` trong thư mục `backend` với nội dung:

```javascript
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function seed() {
    const users = [
        { maTK: 'TK001', password: 'Admin@123' },
        { maTK: 'TK002', password: 'Manager@123' },
        { maTK: 'TK003', password: 'Customer@123' },
    ];
    for (const u of users) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.execute(
            'UPDATE TAIKHOAN SET MatKhau = ? WHERE MaTK = ?',
            [hash, u.maTK]
        );
        console.log(`✅ ${u.maTK} done`);
    }
    process.exit(0);
}
seed();
```

Chạy lệnh:

```cmd
node seedPassword.js
```

Kết quả thành công:
```
✅ TK001 done
✅ TK002 done
✅ TK003 done
```

---

## Bước 6 — Khởi động Server

```cmd
npm run dev
```

Thấy thông báo sau là hệ thống đã sẵn sàng:

```
✅ Kết nối Database thành công!
🚀 Server đang chạy tại http://localhost:3000
```

---

## Bước 7 — Truy cập hệ thống

Mở trình duyệt, vào địa chỉ: **http://localhost:3000**

### Tài khoản mặc định

| Vai trò | Tên đăng nhập | Mật khẩu | Trang sau đăng nhập |
|---|---|---|---|
| Admin | `admin` | `Admin@123` | `/pages/admin.html` |
| Manager | `manager` | `Manager@123` | `/pages/manager.html` |
| Customer | `customer1` | `Customer@123` | `/index.html` |

---

## Những lần chạy tiếp theo

Khi tắt máy và muốn chạy lại, chỉ cần:

```cmd
cd C:\đường_dẫn_đến_thư_mục\flight-booking\backend
npm run dev
```

MySQL tự động chạy cùng Windows nên không cần khởi động lại.

---

## Xử lý lỗi thường gặp

### Lỗi: "Unable to connect to 127.0.0.1:3306"
MySQL chưa chạy. Mở **Services** (Windows + R → `services.msc`) → tìm **MySQL80** → chuột phải → **Start**

### Lỗi: "Access denied for user root"
Sai mật khẩu trong file `.env`. Kiểm tra lại `DB_PASSWORD` có đúng với mật khẩu đặt lúc cài MySQL không.

### Lỗi: "Cannot find module"
Chưa cài thư viện hoặc đang chạy sai thư mục. Kiểm tra terminal đang ở thư mục `backend` và đã chạy `npm install`.

### Lỗi: "Port 3000 already in use"
Đã có tiến trình khác dùng cổng 3000. Tắt terminal cũ hoặc đổi `PORT` trong `.env` thành `3001`.

### Tài khoản không đăng nhập được
Chưa chạy `seedPassword.js`. Chạy lại lệnh `node seedPassword.js` trong thư mục `backend`.

---

## Tính năng theo từng vai trò

### Customer
- Tìm kiếm chuyến bay theo sân bay, ngày, hạng vé
- Đặt chỗ, sửa phiếu đặt, huỷ đặt chỗ
- Xem lịch sử vé của mình

### Manager
- Thêm, sửa, xoá chuyến bay
- Quản lý sân bay trung gian
- Xuất vé, sửa, xoá phiếu đặt
- Xem báo cáo doanh thu theo tháng và năm

### Admin
- Quản lý tài khoản (tạo, khoá, đổi vai trò)
- Quản lý sân bay và hạng vé
- Cập nhật tham số hệ thống (tự động ghi log)
- Xem lịch sử thay đổi quy định
