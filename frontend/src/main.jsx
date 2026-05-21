// === ĐIỂM BẮT ĐẦU CỦA ỨNG DỤNG FRONTEND (Entry point) ===
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Import Component chính của ứng dụng
import './index.css'; // File chứa các cấu hình CSS giao diện chung

// Gắn (render) toàn bộ ứng dụng React vào thẻ <div> có id='root' trong file index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
