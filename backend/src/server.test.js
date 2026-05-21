// === CÁC THƯ VIỆN & CẤU HÌNH MOCK (GIẢ LẬP) CƠ SỞ DỮ LIỆU ===
const request = require('supertest');

// Giả lập (mock) thư viện 'pg' để không cần kết nối Database thật khi chạy test
jest.mock('pg', () => {
  const mockPool = { query: jest.fn() };
  return { Pool: jest.fn(() => mockPool) };
});

const { Pool } = require('pg');
const pool = new Pool();

// Ngăn không cho hàm initDB (trong server.js) chạy lệnh SQL thật trong lúc test
beforeAll(() => {
  pool.query.mockResolvedValue({ rows: [] });
});
// Reset (xóa) lại các giá trị mock sau mỗi lần test để tránh ảnh hưởng lẫn nhau
beforeEach(() => jest.clearAllMocks());

// === CÁC TEST CASES (CÁC TRƯỜNG HỢP KIỂM THỬ) ===
const app = require('../src/server');

// Kiểm thử API Health check (Kiểm tra trạng thái hệ thống)
describe('GET /api/health', () => {
  it('trả 200 khi DB kết nối được', async () => {
    pool.query.mockResolvedValue({});
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// Kiểm thử API Lấy danh sách giao dịch
describe('GET /api/transactions', () => {
  it('trả danh sách giao dịch', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, amount: '50000', description: 'Ăn trưa', type: 'expense' }],
    });
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// Kiểm thử API Thêm giao dịch mới
describe('POST /api/transactions', () => {
  it('tạo giao dịch thành công', async () => {
    pool.query.mockResolvedValue({
      rows: [{ id: 1, amount: '100000', description: 'Lương', type: 'income' }],
    });
    const res = await request(app).post('/api/transactions').send({
      amount: 100000, description: 'Lương', category: 'Thu nhập', type: 'income',
    });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('income');
  });

  it('trả 400 khi thiếu amount', async () => {
    const res = await request(app).post('/api/transactions').send({ description: 'Test', type: 'expense' });
    expect(res.status).toBe(400);
  });

  it('trả 400 khi type không hợp lệ', async () => {
    const res = await request(app).post('/api/transactions').send({ amount: 1000, description: 'X', type: 'invalid' });
    expect(res.status).toBe(400);
  });
});

// Kiểm thử API Xóa giao dịch
describe('DELETE /api/transactions/:id', () => {
  it('trả 404 khi không tìm thấy', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).delete('/api/transactions/999');
    expect(res.status).toBe(404);
  });
});
