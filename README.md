# 💸 Expense Tracker — DevOps Setup

Ứng dụng quản lý chi tiêu cá nhân được container hoá bằng Docker, gồm 3 service: **Frontend (Nginx)**, **Backend (Node.js)**, **Database (PostgreSQL)**.

---

## 🌐 Production URLs

| Service     | URL                                                      |
| ----------- | -------------------------------------------------------- |
| Frontend    | https://devops-vominhnhat-damh-4.onrender.com            |
| Backend API | https://devops-vominhnhat-damh-3.onrender.com/api/health |
| GitHub Repo | https://github.com/Just1ND/DevOps_VoMinhNhat_DAMH        |

---

## 🐳 Docker Hub Images

| Service  | Image                                                                                                                 |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| Frontend | [`minhnhat2k44/expense-tracker:front`](https://hub.docker.com/repository/docker/minhnhat2k44/expense-tracker/general) |
| Backend  | [`minhnhat2k44/expense-tracker:back`](https://hub.docker.com/repository/docker/minhnhat2k44/expense-tracker/general)  |

---

## 🚀 Chạy ứng dụng (Local)

### Yêu cầu

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài và đang chạy

### Bước 1 — Clone repo

```bash
git clone https://github.com/Just1ND/DevOps_VoMinhNhat_DAMH.git
cd DevOps_VoMinhNhat_DAMH
```

### Bước 2 — Tạo file `.env`

```bash
cp .env.example .env
```

Chỉnh sửa `.env` nếu cần:

```env
POSTGRES_PASSWORD=password
FRONTEND_URL=http://localhost
DATABASE_URL=postgresql://postgres:password@localhost:5432/expensetracker
PORT=3001
```

> Nếu không tạo file `.env`, ứng dụng sẽ dùng giá trị mặc định.

### Bước 3 — Build và chạy bằng Docker Compose

```bash
docker compose up -d
```

### Bước 4 — Truy cập

| Service     | URL                              |
| ----------- | -------------------------------- |
| Frontend    | http://localhost                 |
| Backend API | http://localhost:3001/api/health |

### Bước 5 — Xem log container

```bash
# Xem log tất cả service
docker compose logs -f

# Xem log từng service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Dừng ứng dụng

```bash
docker compose down
```

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────┐
│         Client Browser          │
└──────────────┬──────────────────┘
               │ HTTP :80
┌──────────────▼──────────────────┐
│    Frontend (React + Nginx)     │
│    /api/* → proxy → :3001       │
└──────────────┬──────────────────┘
               │ HTTP :3001
┌──────────────▼──────────────────┐
│   Backend (Node.js + Express)   │
│   /api/health                   │
│   /api/transactions             │
└──────────────┬──────────────────┘
               │ TCP :5432
┌──────────────▼──────────────────┐
│    Database (PostgreSQL 16)     │
│    volume: pgdata               │
└─────────────────────────────────┘
```

| Service  | Image              | Port            |
| -------- | ------------------ | --------------- |
| frontend | nginx:alpine       | 80              |
| backend  | node:20-alpine     | 3001            |
| db       | postgres:16-alpine | 5432 (internal) |

---

## 🔄 CI/CD Flow

```
push / pull_request lên main, dev, feature/*
               │
               ▼
  ┌────────────────────────────────┐
  │         GitHub Actions         │
  ├──────────────┬─────────────────┤
  │ Backend Job  │  Frontend Job   │
  │   npm ci     │    npm ci       │
  │   eslint     │    eslint       │
  │   jest       │    vitest       │
  │   docker     │    vite build   │
  │   build      │    docker build │
  └──────┬───────┴────────┬────────┘
         │  (cả 2 pass)   │
         └───────┬─────────┘
                 │ push main only
                 ▼
          Deploy to Render
     (auto-deploy khi push main)
          Frontend + Backend
            live trên cloud
```

---

## ⚙️ CI/CD với GitHub Actions

File `.github/workflows/ci.yml` tự động chạy khi push code:

- **Trigger**: push lên `main`, `dev`, `feature/*` hoặc pull request
- **Backend job**: lint → test → docker build
- **Frontend job**: lint → test → vite build → docker build
- **Deploy job**: tự động deploy lên Render khi push lên `main`

---

## 🐞 Incident Report

Xem chi tiết tại [INCIDENT_REPORT.md](./INCIDENT_REPORT.md)

| #   | Hiện tượng                          | Layer          | Nguyên nhân                                          |
| --- | ----------------------------------- | -------------- | ---------------------------------------------------- |
| 1   | `[DB] Init failed:` (message trống) | Application    | File `.env` không nằm đúng thư mục `backend/`        |
| 2   | `ECONNREFUSED 127.0.0.1:5432`       | Infrastructure | PostgreSQL container không expose port ra host       |
| 3   | `Failed to fetch` trên frontend     | Network/CORS   | Vite proxy sai port + CORS chặn cross-origin request |

---

## 📁 Cấu trúc thư mục

```
expense-tracker/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   └── server.test.js
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── App.test.jsx
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── .env.example
├── INCIDENT_REPORT.md
└── README.md
```

---

## 🛠️ Development (Local dev không dùng Docker)

> Yêu cầu: Node.js 20+, Docker Desktop (để chạy DB)

### Bước 1 — Khởi động Database

```bash
# Chỉ start container DB (không cần chạy cả backend/frontend bằng Docker)
docker compose up db -d
```

### Bước 2 — Chạy Backend

```bash
cd backend
cp .env.example .env      # lần đầu setup
npm install               # lần đầu setup
npm run dev               # dev server với hot-reload tại http://localhost:3002
```

| Lệnh           | Mô tả                                             |
| -------------- | ------------------------------------------------- |
| `npm run dev`  | Chạy server với nodemon (tự reload khi sửa code)  |
| `npm start`    | Chạy server không có hot-reload (production mode) |
| `npm run lint` | Kiểm tra lỗi code style bằng ESLint               |
| `npm test`     | Chạy toàn bộ test bằng Jest                       |

### Bước 3 — Chạy Frontend

Mở terminal mới:

```bash
cd frontend
npm install               # lần đầu setup
npm run dev               # dev server tại http://localhost:5173
```

| Lệnh              | Mô tả                                          |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Chạy Vite dev server tại http://localhost:5173 |
| `npm run build`   | Build production bundle vào thư mục `dist/`    |
| `npm run preview` | Preview bản build production tại local         |
| `npm run lint`    | Kiểm tra lỗi code style bằng ESLint            |
| `npm test`        | Chạy toàn bộ test bằng Vitest                  |

### Chạy Test

```bash
# Test backend (Jest)
cd backend
npm test

# Test frontend (Vitest)
cd frontend
npm test
```

---

## 🌿 Git Workflow

### Clone repo lần đầu

```bash
git clone https://github.com/Just1ND/DevOps_VoMinhNhat_DAMH.git
cd DevOps_VoMinhNhat_DAMH
```

### Quy trình làm việc hàng ngày

```bash
# 1. Tạo nhánh mới từ dev
git checkout dev
git pull origin dev
git checkout -b feature/ten-tinh-nang

# 2. Sau khi code xong, kiểm tra thay đổi
git status
git diff

# 3. Stage và commit
git add .
git commit -m "feat: mô tả ngắn gọn thay đổi"

# 4. Push nhánh lên GitHub
git push origin feature/ten-tinh-nang

# 5. Tạo Pull Request lên nhánh dev trên GitHub
```

### Các lệnh Git thường dùng

```bash
git status                        # xem file nào đã thay đổi
git log --oneline -10             # xem 10 commit gần nhất
git diff                          # xem chi tiết thay đổi chưa stage
git stash                         # lưu tạm thay đổi chưa commit
git stash pop                     # lấy lại thay đổi đã stash
git pull origin dev               # cập nhật code mới nhất từ nhánh dev
```

### Quy ước đặt tên commit

| Prefix      | Dùng khi                                        |
| ----------- | ----------------------------------------------- |
| `feat:`     | Thêm tính năng mới                              |
| `fix:`      | Sửa bug                                         |
| `docs:`     | Cập nhật tài liệu                               |
| `ci:`       | Thay đổi CI/CD pipeline                         |
| `refactor:` | Refactor code, không thêm tính năng hay sửa bug |

---

## 👤 Tác giả

**Võ Minh Nhật**

- GitHub: [@Just1ND](https://github.com/Just1ND/DevOps_VoMinhNhat_DAMH)
- Docker Hub: [minhnhat2k44/expense-tracker](https://hub.docker.com/repository/docker/minhnhat2k44/expense-tracker/general)
