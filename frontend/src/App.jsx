import { useState, useEffect, useCallback } from 'react';

// ── Không hardcode URL — dùng biến môi trường VITE_* ─────────────────────────
const API = import.meta.env.VITE_API_URL || '';

const fmt = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

async function http(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const CATEGORIES = {
  expense: ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Hóa đơn', 'Giải trí', 'Sức khỏe', 'Khác'],
  income:  ['Lương', 'Freelance', 'Đầu tư', 'Quà tặng', 'Khác'],
};

const initForm = { amount: '', description: '', category: 'Ăn uống', type: 'expense' };

export default function App() {
  // === CÁC STATE (TRẠNG THÁI) CỦA ỨNG DỤNG ===
  const [transactions, setTransactions] = useState([]); // Danh sách giao dịch
  const [summary, setSummary]           = useState({ total_income: 0, total_expense: 0, balance: 0 }); // Tổng quan thu/chi/số dư
  const [form, setForm]                 = useState(initForm); // Dữ liệu của form thêm mới
  const [filter, setFilter]             = useState('all'); // Bộ lọc danh sách (tất cả, thu/chi)
  const [loading, setLoading]           = useState(true); // Trạng thái đang tải dữ liệu
  const [error, setError]               = useState(null); // Thông báo lỗi nếu có
  const [submitting, setSubmitting]     = useState(false); // Trạng thái đang gửi dữ liệu lên server

  // === HÀM TẢI DỮ LIỆU: Lấy danh sách giao dịch và tổng quan từ API ===
  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [txs, sum] = await Promise.all([
        http('/api/transactions'),
        http('/api/transactions/summary'),
      ]);
      setTransactions(txs);
      setSummary(sum);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi hàm loadAll() tự động một lần khi ứng dụng vừa khởi chạy
  useEffect(() => { loadAll(); }, [loadAll]);

  // === HÀM XỬ LÝ NHẬP LIỆU: Cập nhật state 'form' khi người dùng gõ vào các ô input ===
  const handleField = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      // Tự động reset danh mục (category) về mục đầu tiên khi người dùng đổi loại (type) thu/chi
      if (k === 'type') next.category = CATEGORIES[v][0];
      return next;
    });
  };

  // === HÀM THÊM GIAO DỊCH: Gửi dữ liệu form lên API và cập nhật lại giao diện ===
  const addTx = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const tx = await http('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      setTransactions(prev => [tx, ...prev]);
      setSummary(prev => {
        const amt = Number(tx.amount);
        return tx.type === 'income'
          ? { ...prev, total_income: +prev.total_income + amt, balance: +prev.balance + amt }
          : { ...prev, total_expense: +prev.total_expense + amt, balance: +prev.balance - amt };
      });
      setForm(f => ({ ...initForm, type: f.type, category: CATEGORIES[f.type][0] }));
    } catch (e) {
      setError('Thêm thất bại: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // === HÀM XÓA GIAO DỊCH: Gọi API xóa và tính toán lại tổng quan ===
  const deleteTx = async (tx) => {
    // Xóa tạm thời trên giao diện (Optimistic update) để phản hồi nhanh
    setTransactions(prev => prev.filter(t => t.id !== tx.id));
    setSummary(prev => {
      const amt = Number(tx.amount);
      return tx.type === 'income'
        ? { ...prev, total_income: +prev.total_income - amt, balance: +prev.balance - amt }
        : { ...prev, total_expense: +prev.total_expense - amt, balance: +prev.balance + amt };
    });
    try {
      await http(`/api/transactions/${tx.id}`, { method: 'DELETE' });
    } catch {
      loadAll(); // rollback
    }
  };

  // === LỌC DỮ LIỆU HIỂN THỊ: Dựa vào state 'filter' (tất cả / thu / chi) ===
  const visible = transactions.filter(t =>
    filter === 'all' ? true : t.type === filter
  );

  return (
    <div className="root">
      {/* === PHẦN 1: HEADER & THỐNG KÊ TỔNG QUAN (Summary cards) === */}
      <header className="page-header">
        <h1 className="page-title">💸 Quản lý chi tiêu</h1>
        <div className="summary-grid">
          <div className="card summary income">
            <span className="s-label">Thu nhập</span>
            <span className="s-amount">{fmt(summary.total_income)}</span>
          </div>
          <div className="card summary expense">
            <span className="s-label">Chi tiêu</span>
            <span className="s-amount">{fmt(summary.total_expense)}</span>
          </div>
          <div className={`card summary balance ${Number(summary.balance) >= 0 ? 'pos' : 'neg'}`}>
            <span className="s-label">Số dư</span>
            <span className="s-amount">{fmt(summary.balance)}</span>
          </div>
        </div>
      </header>

      <div className="main">
        {/* === PHẦN 2: BIỂU MẪU THÊM GIAO DỊCH (Add form) === */}
        <section className="card form-card">
          <h2 className="section-title">Thêm giao dịch</h2>
          <form className="form" onSubmit={addTx}>
            {/* Type toggle */}
            <div className="type-toggle">
              {['expense','income'].map(t => (
                <button
                  key={t} type="button"
                  className={`type-btn ${form.type === t ? 'active ' + t : ''}`}
                  onClick={() => handleField('type', t)}
                >
                  {t === 'expense' ? '💸 Chi tiêu' : '💰 Thu nhập'}
                </button>
              ))}
            </div>

            <div className="form-row">
              <label className="label">Số tiền (VNĐ)</label>
              <input
                type="number" className="input" placeholder="100000"
                value={form.amount} min="1"
                onChange={e => handleField('amount', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label className="label">Mô tả</label>
              <input
                type="text" className="input" placeholder="Ăn trưa, tiền điện..."
                value={form.description} maxLength={255}
                onChange={e => handleField('description', e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label className="label">Danh mục</label>
              <select className="input select" value={form.category}
                onChange={e => handleField('category', e.target.value)}>
                {CATEGORIES[form.type].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <button type="submit" className={`submit-btn ${form.type}`} disabled={submitting}>
              {submitting ? 'Đang lưu...' : `+ Thêm ${form.type === 'expense' ? 'chi tiêu' : 'thu nhập'}`}
            </button>
          </form>
        </section>

        {/* === PHẦN 3: DANH SÁCH LỊCH SỬ GIAO DỊCH (Transaction list) === */}
        <section className="card list-card">
          <div className="list-header">
            <h2 className="section-title">Lịch sử</h2>
            <div className="filters">
              {[['all','Tất cả'],['expense','Chi tiêu'],['income','Thu nhập']].map(([k,v]) => (
                <button
                  key={k}
                  className={`filter-btn ${filter === k ? 'active' : ''}`}
                  onClick={() => setFilter(k)}
                >{v}</button>
              ))}
            </div>
          </div>

          {error && (
            <div className="error-msg">⚠ {error}
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}

          <div className="tx-list">
            {loading ? (
              <div className="empty">Đang tải...</div>
            ) : visible.length === 0 ? (
              <div className="empty">Chưa có giao dịch nào</div>
            ) : visible.map(tx => (
              <div key={tx.id} className={`tx-item ${tx.type}`}>
                <div className="tx-icon">{tx.type === 'expense' ? '💸' : '💰'}</div>
                <div className="tx-body">
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-meta">{tx.category} · {new Date(tx.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <span className={`tx-amount ${tx.type}`}>
                  {tx.type === 'expense' ? '-' : '+'}{fmt(tx.amount)}
                </span>
                <button className="del-btn" onClick={() => deleteTx(tx)} aria-label="Xóa">✕</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
