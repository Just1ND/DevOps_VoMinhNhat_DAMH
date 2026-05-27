# Incident Report — Expense Tracker

---

## Incident 1: Backend không khởi động được — `[DB] Init failed:` (message trống)

### Hiện tượng
Chạy `npm run dev` trong thư mục `backend/`, server crash ngay lập tức với thông báo:
```
[DB] Init failed:
[nodemon] app crashed - waiting for file changes before starting...
```
Error message hoàn toàn trống, không có thông tin gì để debug.

### Layer
**Application Layer** — Backend Node.js không đọc được biến môi trường `DATABASE_URL`.

### Nguyên nhân
File `.env` được đặt ở thư mục gốc `expense-tracker/`, trong khi `dotenv` mặc định tìm `.env` tại **thư mục hiện tại** khi chạy lệnh (`expense-tracker/backend/`). Vì `.env` không tồn tại trong `backend/`, `process.env.DATABASE_URL` là `undefined`, khiến `pg.Pool` không thể khởi tạo kết nối và ném lỗi không có message.

### Cách fix
Tạo file `backend/.env` riêng chứa đúng connection string:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensetracker
PORT=3002
FRONTEND_URL=http://localhost:5173
```

### Cách phòng tránh
- Thêm bước kiểm tra biến môi trường bắt buộc khi khởi động:
  ```js
  if (!process.env.DATABASE_URL) {
    console.error('[FATAL] DATABASE_URL is not set');
    process.exit(1);
  }
  ```
- Log full error object (`console.error(err)`) thay vì chỉ `err.message` để dễ debug.
- Thêm file `backend/.env.example` vào repo làm template.

---

## Incident 2: Backend kết nối được DB nhưng port bị từ chối — `ECONNREFUSED 127.0.0.1:5432`

### Hiện tượng
Sau khi tạo `backend/.env` với `DATABASE_URL=postgresql://postgres:password@localhost:5432/expensetracker`, server vẫn không kết nối được database. PostgreSQL đang chạy nhưng không accessible từ host.

### Layer
**Infrastructure / Network Layer** — Docker container `expense_db` chạy PostgreSQL nhưng port 5432 không được expose ra máy host.

### Nguyên nhân
Trong `docker-compose.yml`, service `db` không có cấu hình `ports`. Container chỉ join Docker internal network (accessible qua hostname `db` từ các container khác), nhưng **không** bind port 5432 ra `localhost` của máy host. Kết quả: `npm run dev` trên host không thể reach PostgreSQL.

```yaml
# Trước (thiếu ports)
db:
  image: postgres:16-alpine
  # không có ports → chỉ accessible trong Docker network
```

### Cách fix
Thêm `ports` mapping vào service `db`:
```yaml
db:
  image: postgres:16-alpine
  ports:
    - "5432:5432"  # Expose ra host để local dev kết nối được
```
Sau đó restart: `docker compose up -d db`

### Cách phòng tránh
- Có 2 môi trường rõ ràng: `docker-compose.yml` (production, không expose DB) và `docker-compose.dev.yml` (development, expose DB port).
- Document rõ trong README: khi dev local cần expose port DB.
- Kiểm tra connectivity trước khi start app: `pg_isready -h localhost -p 5432`.

---

## Incident 3: Frontend hiển thị "Failed to fetch" — không lấy được dữ liệu

### Hiện tượng
Frontend React tại `http://localhost:5173/` hiển thị lỗi **"Failed to fetch"** trong phần Lịch sử giao dịch. Dữ liệu không hiển thị dù backend đang chạy và DB đã kết nối.

### Layer
**Network / CORS Layer** — Browser chặn cross-origin request từ frontend đến backend do CORS policy.

### Nguyên nhân
Hai vấn đề kết hợp:
1. **CORS**: Backend cấu hình `cors({ origin: 'http://localhost' })` nhưng frontend chạy tại `http://localhost:5173` — origin khác → browser block request.
2. **Vite proxy lỗi cấu hình**: `vite.config.js` proxy `/api` tới `http://localhost:3001` (Docker backend), trong khi backend local đang chạy ở port `3002`.

```js
// vite.config.js — sai port
proxy: { '/api': { target: 'http://localhost:3001' } }
```

### Cách fix
1. Sửa Vite proxy trỏ đúng port backend local:
   ```js
   proxy: { '/api': { target: 'http://localhost:3002', changeOrigin: true } }
   ```
2. Xóa `VITE_API_URL` trong `frontend/.env` (để trống) để React dùng relative path `/api/...`, Vite proxy xử lý — tránh hoàn toàn vấn đề CORS vì request đi qua Vite dev server (server-to-server, không qua browser).

### Cách phòng tránh
- Luôn dùng **Vite proxy** trong môi trường dev thay vì gọi trực tiếp cross-origin URL.
- Thêm `FRONTEND_URL` vào `backend/.env` cho đúng origin (`http://localhost:5173`) khi cần gọi trực tiếp.
- Có health-check script tự động verify frontend → backend connectivity sau khi start.
