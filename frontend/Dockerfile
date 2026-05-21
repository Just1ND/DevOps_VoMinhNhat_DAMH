# === GIAI ĐOẠN 1 (builder): Build dự án React (Vite) ===
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci # Cài đặt toàn bộ thư viện (cả devDependencies để build)
COPY . .
# Cấu hình để nhận tham số đường dẫn API khi thực hiện quá trình build
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build # Đóng gói ứng dụng thành các file tĩnh (HTML, CSS, JS)

# === GIAI ĐOẠN 2 (runtime): Phục vụ website bằng Nginx ===
FROM nginx:alpine AS runtime
# Sao chép các file web tĩnh đã build từ Giai đoạn 1 vào thư mục chứa code của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Sao chép cấu hình tùy chỉnh cho Nginx (như proxy, rewrite rules)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Khai báo cổng 80 cho web server
EXPOSE 80
# Lệnh chạy server Nginx
CMD ["nginx", "-g", "daemon off;"]
