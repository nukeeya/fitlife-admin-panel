import { useState } from 'react';
import { Plus } from 'lucide-react';
import { payments as gymPayments, paymentSummary } from '../data/gymData';

export default function Payments() {
<<<<<<< Updated upstream
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalRevenue: '৳0', paid: '৳0', pending: '৳0' });

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        plan,
        amount,
        method,
        status,
        payment_date,
        members(first_name, last_name)
      `)
      .order('payment_date', { ascending: false });

    if (!error && data) {
      setPayments(data.map(p => ({
        id: p.id,
        member: p.members ? `${p.members.first_name} ${p.members.last_name}` : 'Unknown',
        plan: p.plan,
        amount: p.amount,
        method: p.method,
        status: p.status,
        date: p.payment_date,
      })));

      // Calculate summary
      let totalPaid = 0;
      let totalPending = 0;
      data.forEach(p => {
        const amt = Number(String(p.amount).replace(/[^\d.-]/g, '')) || 0;
        if (p.status === 'Paid') totalPaid += amt;
        else totalPending += amt;
      });
      setSummary({
        totalRevenue: `৳${(totalPaid + totalPending).toLocaleString()}`,
        paid: `৳${totalPaid.toLocaleString()}`,
        pending: `৳${totalPending.toLocaleString()}`,
      });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--lime)' }} />
      </div>
    );
  }
=======
  const [payments] = useState(gymPayments);
>>>>>>> Stashed changes

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{paymentSummary.totalRevenue}</span> Monthly Revenue
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary">
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">TOTAL REVENUE</span>
          <div className="stat-value">{paymentSummary.totalRevenue}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">PAID</span>
          <div className="stat-value" style={{ color: '#10B981' }}>{paymentSummary.paid}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">PENDING</span>
          <div className="stat-value" style={{ color: '#EF4444' }}>{paymentSummary.pending}</div>
        </div>
      </div>

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
<<<<<<< Updated upstream
                <td>৳{Number(p.amount).toLocaleString()}</td>
=======
                <td style={{ fontWeight: 700 }}>{p.amount}</td>
>>>>>>> Stashed changes
                <td>{p.method}</td>
                <td>
                  <span className={`status-badge ${p.status === 'Paid' ? 'active' : 'expiring'}`}>
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
