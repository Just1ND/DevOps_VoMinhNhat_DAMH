# 💸 Expense Tracker — DevOps Setup

Ứng dụng quản lý chi tiêu cá nhân được container hoá bằng Docker, gồm 3 service: **Frontend (Nginx)**, **Backend (Node.js)**, **Database (PostgreSQL)**.

---

## 🐳 Docker Hub Images

| Service  | Image |
|----------|-------|
| Frontend | [`minhnhat2k44/expense-tracker-front:latest`](https://hub.docker.com/r/minhnhat2k44/expense-tracker-front) |
| Backend  | [`minhnhat2k44/expense-tracker-back:latest`](https://hub.docker.com/r/minhnhat2k44/expense-tracker-back) |

---

## 🚀 Chạy ứng dụng

### Yêu cầu
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) đã được cài và đang chạy

### Bước 1 — Clone repo

```bash
git clone https://github.com/Just1ND/DevOps_VoMinhNhat.git
cd DevOps_VoMinhNhat
```

### Bước 2 — Tạo file `.env` (tuỳ chọn)

```env
POSTGRES_PASSWORD=your_password
FRONTEND_URL=http://localhost
```

> Nếu không tạo file `.env`, ứng dụng sẽ dùng giá trị mặc định.

### Bước 3 — Chạy bằng Docker Compose

```bash
docker compose up -d
```

### Bước 4 — Truy cập

| Service  | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:3001/api/health |

### Dừng ứng dụng

```bash
docker compose down
```

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────┐
│              Docker Network             │
│                                         │
│  [Browser] → [Frontend :80]             │
│                    ↓                    │
│             [Backend :3001]             │
│                    ↓                    │
│           [PostgreSQL :5432]            │
└─────────────────────────────────────────┘
```

| Service  | Image | Port |
|----------|-------|------|
| frontend | nginx:alpine | 80 |
| backend  | node:20-alpine | 3001 |
| db       | postgres:16-alpine | 5432 (internal) |

---

## 🛠️ Build & Push lên Docker Hub

### Build image

```bash
docker compose build
```

### Push lên Docker Hub

```bash
docker login
docker compose push
```

### Build + Push một lệnh (Linux/macOS)

```bash
docker compose build && docker compose push
```

### Build + Push một lệnh (Windows PowerShell)

```powershell
docker compose build; docker compose push
```

---

## ⚙️ CI/CD với GitHub Actions

File `.github/workflows/docker.yml` tự động build và push image mỗi khi push code lên nhánh `main` hoặc `develop`.

```yaml
name: Build & Push Docker

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: minhnhat2k44
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build & Push
        run: |
          docker compose build
          docker compose push
```

### Cách thêm Secret vào GitHub

1. Vào **Docker Hub → Account Settings → Personal Access Tokens** → tạo token mới
2. Vào **GitHub repo → Settings → Secrets and variables → Actions**
3. Thêm secret tên `DOCKERHUB_TOKEN` với giá trị là token vừa tạo

---

## 🔄 Cập nhật image khi có thay đổi code

### Nếu đã setup CI/CD
```bash
git add .
git commit -m "update: mô tả thay đổi"
git push
```
> GitHub Actions sẽ tự động build và push lên Docker Hub.

### Nếu chưa có CI/CD (thủ công)
```bash
docker compose build
docker compose push
```

---

## 📁 Cấu trúc thư mục

```
expense-tracker/
├── backend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/
│       └── docker.yml
├── docker-compose.yml
└── README.md
```

---

## 👤 Tác giả

**Võ Minh Nhật**
- GitHub: [@Just1ND](https://github.com/Just1ND)
- Docker Hub: [minhnhat2k44](https://hub.docker.com/u/minhnhat2k44)
