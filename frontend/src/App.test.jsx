import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

globalThis.fetch = vi.fn();

const mockTx = [{ id: 1, amount: '150000', description: 'Ăn trưa', category: 'Ăn uống', type: 'expense', created_at: new Date().toISOString() }];
const mockSummary = { total_income: '0', total_expense: '150000', balance: '-150000' };

beforeEach(() => {
  fetch.mockReset();
  fetch
    .mockResolvedValueOnce({ ok: true, json: async () => mockTx })
    .mockResolvedValueOnce({ ok: true, json: async () => mockSummary });
});

describe('App', () => {
  it('renders title', async () => {
    render(<App />);
    expect(screen.getByText(/Quản lý chi tiêu/i)).toBeInTheDocument();
  });

  it('shows transaction after load', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Ăn trưa')).toBeInTheDocument());
  });
});
