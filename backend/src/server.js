// === CÁC THƯ VIỆN & CẤU HÌNH BAN ĐẦU ===
require('dotenv').config(); // Load các biến môi trường từ file .env
const express = require('express'); // Framework tạo server web
const cors = require('cors'); // Middleware cho phép kết nối từ domain khác (Frontend)
const { Pool } = require('pg'); // Client kết nối cơ sở dữ liệu PostgreSQL

const app = express();
const PORT = process.env.PORT || 3001;

// === KẾT NỐI & KHỞI TẠO CƠ SỞ DỮ LIỆU (Database) ===
// ── Database ──────────────────────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Hàm khởi tạo: Tự động tạo bảng 'transactions' nếu chưa tồn tại trong DB
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          SERIAL PRIMARY KEY,
        amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
        description VARCHAR(255)   NOT NULL,
        category    VARCHAR(100)   NOT NULL DEFAULT 'Khác',
        type        VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
        created_at  TIMESTAMP      DEFAULT NOW()
      )
    `);
    console.log('[DB] Table "transactions" ready');
  } catch (err) {
    console.error('[DB] Init failed:', err.message);
    process.exit(1);
  }
}

// === MIDDLEWARE (Xử lý request trước khi vào các Route) ===
// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' })); // Chấp nhận request từ Frontend (tránh lỗi CORS)
app.use(express.json()); // Phân tích body của request HTTP dưới dạng JSON

// === CÁC API ROUTES (Đường dẫn xử lý yêu cầu từ Client) ===
// ── Routes ────────────────────────────────────────────────────────────────────

// API 1: Kiểm tra trạng thái hoạt động của Server và Database (Health check)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ ok: false, db: 'disconnected' });
  }
});

// API 2: Lấy danh sách giao dịch (có thể truyền query ?type=income|expense để lọc dữ liệu)
app.get('/api/transactions', async (req, res) => {
  try {
    const { type } = req.query;
    const values = [];
    let sql = 'SELECT * FROM transactions';
    if (type) {
      sql += ' WHERE type = $1';
      values.push(type);
    }
    sql += ' ORDER BY created_at DESC';
    const result = await pool.query(sql, values);
    res.json(result.rows);
  } catch (err) {
    console.error('[GET /api/transactions]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API 3: Thống kê tổng số tiền thu, chi và số dư hiện tại
app.get('/api/transactions/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) AS balance
      FROM transactions
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[GET /api/transactions/summary]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API 4: Thêm một giao dịch mới (Thu nhập hoặc Chi tiêu)
app.post('/api/transactions', async (req, res) => {
  const { amount, description, category, type } = req.body;
  if (!amount || !description || !type) {
    return res.status(400).json({ error: 'amount, description và type là bắt buộc' });
  }
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type phải là income hoặc expense' });
  }
  if (Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount phải lớn hơn 0' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO transactions (amount, description, category, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [amount, description.trim(), (category || 'Khác').trim(), type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[POST /api/transactions]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API 5: Xóa một giao dịch cụ thể dựa vào tham số ID
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    res.json({ message: 'Đã xóa giao dịch', id });
  } catch (err) {
    console.error('[DELETE /api/transactions/:id]', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// === KHỞI ĐỘNG SERVER ===
// ── Start ─────────────────────────────────────────────────────────────────────
// Chạy hàm khởi tạo Database trước, thành công mới bắt đầu lắng nghe request
if (require.main === module) {
  initDB().then(() => {
    app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));
  });
} else {
  initDB();
}

module.exports = app;
