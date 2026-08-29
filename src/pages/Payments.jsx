import { Plus } from 'lucide-react';
import { payments, paymentSummary } from '../data/gymData';

export default function Payments() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">PAYMENTS</h1>
          <p className="page-subtitle">
            <span className="highlight-number">{paymentSummary.totalRevenue}</span> MONTHLY REVENUE
          </p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <Plus size={16} /> RECORD PAYMENT
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">TOTAL REVENUE</span>
          <div className="stat-value">{paymentSummary.totalRevenue}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">PAID</span>
          <div className="stat-value">{paymentSummary.paid}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">PENDING</span>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{paymentSummary.pending}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-card">
        <div className="table-header">
          <h2 className="chart-title">RECENT TRANSACTIONS</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>PLAN</th>
              <th>AMOUNT</th>
              <th>METHOD</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{p.member}</td>
                <td>{p.plan}</td>
                <td>{p.amount}</td>
                <td>{p.method}</td>
                <td>
                  <span
                    className={`status-badge ${p.status === 'Paid' ? 'active' : 'expiring'}`}
                  >
                    ● {p.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
