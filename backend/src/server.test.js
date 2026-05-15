const request = require('supertest');

jest.mock('pg', () => {
  const mockPool = { query: jest.fn() };
  return { Pool: jest.fn(() => mockPool) };
});

const { Pool } = require('pg');
const pool = new Pool();

// Suppress initDB during tests
beforeAll(() => {
  pool.query.mockResolvedValue({ rows: [] });
});
beforeEach(() => jest.clearAllMocks());

const app = require('../src/server');

describe('GET /api/health', () => {
  it('trả 200 khi DB kết nối được', async () => {
    pool.query.mockResolvedValue({});
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

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

describe('DELETE /api/transactions/:id', () => {
  it('trả 404 khi không tìm thấy', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).delete('/api/transactions/999');
    expect(res.status).toBe(404);
  });
});
