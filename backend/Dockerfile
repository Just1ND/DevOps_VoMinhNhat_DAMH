# === GIAI ĐOẠN 1 (deps): Cài đặt thư viện (Dependencies) ===
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production # Chỉ cài đặt các thư viện cần thiết cho môi trường thực tế (production)

# === GIAI ĐOẠN 2 (runtime): Chạy ứng dụng ===
FROM node:20-alpine AS runtime
WORKDIR /app
# Sao chép các thư viện đã được cài đặt ở Giai đoạn 1 sang
COPY --from=deps /app/node_modules ./node_modules
# Sao chép mã nguồn ứng dụng
COPY src/ ./src/
COPY package.json ./
# Khai báo cổng ứng dụng sẽ chạy (chỉ mang tính document, cổng thực được định nghĩa ở docker-compose)
EXPOSE 3001
# Lệnh mặc định khởi động ứng dụng
CMD ["node", "src/server.js"]
