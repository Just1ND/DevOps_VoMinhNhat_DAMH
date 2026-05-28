# 💸 Expense Tracker — DevOps Setup

Ứng dụng quản lý chi tiêu cá nhân được container hoá bằng Docker, gồm 3 service: **Frontend (Nginx)**, **Backend (Node.js)**, **Database (PostgreSQL)**.

---

## 🌐 Production URLs

| Service     | URL                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------- |
| Frontend    | https://devops-vominhnhat-damh-4.onrender.com                                                |
| Backend API | https://devops-vominhnhat-damh-3.onrender.com/api/health                                     |
| GitHub Repo | https://github.com/Just1ND/DevOps_VoMinhNhat_DAMH                                           |

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

| # | Hiện tượng | Layer | Nguyên nhân |
|---|---|---|---|
| 1 | `[DB] Init failed:` (message trống) | Application | File `.env` không nằm đúng thư mục `backend/` |
| 2 | `ECONNREFUSED 127.0.0.1:5432` | Infrastructure | PostgreSQL container không expose port ra host |
| 3 | `Failed to fetch` trên frontend | Network/CORS | Vite proxy sai port + CORS chặn cross-origin request |

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

```bash
# Backend
cd backend
cp .env.example .env   # chỉnh DATABASE_URL nếu cần
npm install
npm run dev            # chạy tại http://localhost:3002

# Frontend (terminal khác)
cd frontend
npm install
npm run dev            # chạy tại http://localhost:5173
```

---

## 👤 Tác giả

**Võ Minh Nhật**

- GitHub: [@Just1ND](https://github.com/Just1ND/DevOps_VoMinhNhat_DAMH)
- Docker Hub: [minhnhat2k44/expense-tracker](https://hub.docker.com/repository/docker/minhnhat2k44/expense-tracker/general)
