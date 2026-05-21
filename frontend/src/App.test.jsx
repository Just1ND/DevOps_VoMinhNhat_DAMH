// === CÁC THƯ VIỆN & CẤU HÌNH MOCK (GIẢ LẬP) CHO FRONTEND ===
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// Giả lập hàm 'fetch' (hàm gọi API) toàn cục để không gọi ra Server thật khi test
globalThis.fetch = vi.fn();

// Dữ liệu giả lập trả về từ API
const mockTx = [{ id: 1, amount: '150000', description: 'Ăn trưa', category: 'Ăn uống', type: 'expense', created_at: new Date().toISOString() }];
const mockSummary = { total_income: '0', total_expense: '150000', balance: '-150000' };

// Hàm chạy trước mỗi test case để xóa bộ nhớ tạm và thiết lập kết quả trả về cho 'fetch'
beforeEach(() => {
  fetch.mockReset();
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => mockTx })
    .mockResolvedValueOnce({ ok: true, json: async () => mockSummary });
});

// === CÁC TEST CASES (CÁC TRƯỜNG HỢP KIỂM THỬ) GIAO DIỆN ===
describe('App', () => {
  it('renders title', async () => {
    // Bước 1: Render Component ra màn hình ảo
    render(<App />);
    // Bước 2: Kiểm tra xem tiêu đề 'Quản lý chi tiêu' có xuất hiện hay không
    expect(screen.getByText(/Quản lý chi tiêu/i)).toBeInTheDocument();
  });

  it('shows transaction after load', async () => {
    render(<App />);
    // Đợi cho đến khi text 'Ăn trưa' (thuộc về giao dịch giả lập ở trên) được hiển thị trên giao diện
    await waitFor(() => expect(screen.getByText('Ăn trưa')).toBeInTheDocument());
  });
});
