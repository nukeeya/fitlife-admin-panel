import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, CheckCircle2, CreditCard, DollarSign, Calendar, Tag } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/common/Modal';

export default function Payments() {
  const { invoices, collectPayment, members } = useGymData();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKASH');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        plan,
        amount,
        method,
        status,
        payment_date,
        transaction_reference,
        members(first_name, last_name, member_code)
      `)
      .order('payment_date', { ascending: false });

    if (!error && data) {
      setPayments(
        data.map((p) => ({
          id: p.id,
          member: p.members ? `${p.members.first_name} ${p.members.last_name}`.trim() : 'Member',
          memberCode: p.members?.member_code || 'FLM',
          plan: p.plan || 'Membership',
          amount: Number(p.amount) || 0,
          method: p.method,
          status: p.status,
          trxId: p.transaction_reference,
          date: (p.payment_date || '').slice(0, 10),
        }))
      );
    }
    setLoading(false);
  }

  // Summary calculated dynamically from invoices
  const summary = useMemo(() => {
    const totalRevenue = invoices.reduce((sum, i) => sum + (Number(i.netPayable) || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0);
    const totalDue = invoices.reduce((sum, i) => sum + (Number(i.dueAmount) || 0), 0);
    return {
      totalRevenue: `৳${totalRevenue.toLocaleString()}`,
      paid: `৳${totalPaid.toLocaleString()}`,
      pending: `৳${totalDue.toLocaleString()}`,
    };
  }, [invoices]);

  // Invoices eligible for payment (due > 0 or all invoices)
  const pendingInvoices = useMemo(() => {
    return invoices.filter((i) => (Number(i.dueAmount) || 0) > 0);
  }, [invoices]);

  const handleOpenRecordPayment = (inv = null) => {
    const target = inv || pendingInvoices[0] || invoices[0];
    if (target) {
      setSelectedInvoiceId(String(target.id));
      setPaymentAmount(String(target.dueAmount > 0 ? target.dueAmount : target.netPayable));
    } else {
      setSelectedInvoiceId('');
      setPaymentAmount('');
    }
    setPaymentMethod('bKASH');
    setTrxId('');
    setSuccessMessage('');
    setShowModal(true);
  };

  const handleInvoiceChange = (id) => {
    setSelectedInvoiceId(id);
    const found = invoices.find((i) => String(i.id) === String(id));
    if (found) {
      setPaymentAmount(String(found.dueAmount > 0 ? found.dueAmount : found.netPayable));
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId || !paymentAmount) return;

    setSubmitting(true);
    try {
      await collectPayment({
        invoiceId: Number(selectedInvoiceId),
        amount: Number(paymentAmount),
        method: paymentMethod,
        trxId,
      });

      await fetchPayments();
      setSuccessMessage('Payment successfully collected and invoice balance updated!');
      setTimeout(() => {
        setShowModal(false);
        setSuccessMessage('');
      }, 1200);
    } catch (err) {
      console.error('Failed to collect payment:', err);
      alert('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) =>
    p.member.toLowerCase().includes(search.toLowerCase()) ||
    p.method.toLowerCase().includes(search.toLowerCase()) ||
    (p.trxId && p.trxId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Receipts</h1>
          <p className="page-subtitle">
            <span className="highlight-number">{summary.totalRevenue}</span> TOTAL BILLED REVENUE
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => handleOpenRecordPayment()}>
            <Plus size={16} /> RECORD PAYMENT
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-card-title">TOTAL BILLED</span>
          <div className="stat-card-value">{summary.totalRevenue}</div>
          <span className="stat-card-label">Cumulative invoice charges</span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <span className="stat-card-title" style={{ color: '#10B981' }}>TOTAL COLLECTED</span>
          <div className="stat-card-value" style={{ color: '#10B981' }}>{summary.paid}</div>
          <span className="stat-card-label">Payments received to date</span>
        </div>
        <div className="stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
          <span className="stat-card-title" style={{ color: '#EF4444' }}>TOTAL PENDING DUE</span>
          <div className="stat-card-value" style={{ color: '#EF4444' }}>{summary.pending}</div>
          <span className="stat-card-label">Outstanding member balance</span>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          marginBottom: '20px',
        }}
      >
        <div className="header-search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search payments by member, method, Trx ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {filtered.length} Recorded Payment Receipt(s)
        </div>
      </div>

      {/* Transactions Table */}
      <div className="activity-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan / Package</th>
                <th>Amount Paid</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading payment records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No payment receipts found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar-initials">
                          {p.member.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700 }}>{p.member}</span>
                          {p.trxId && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              Ref: {p.trxId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{p.plan}</span></td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      ৳{Number(p.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-primary">{p.method}</span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{p.date}</td>
                    <td>
                      <span className={`badge ${p.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Record Member Payment"
        subtitle="Collect cash, bKASH, or card dues against member invoice"
        icon={CreditCard}
        size="md"
      >
        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={44} color="#10B981" />
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Payment Recorded!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleRecordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Invoice / Member Dues</label>
              <select
                className="form-select"
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                required
              >
                {invoices.length === 0 ? (
                  <option value="">No invoices found</option>
                ) : (
                  invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.number} — {inv.memberName} ({inv.memberCode}) [Due: ৳{inv.dueAmount?.toLocaleString()} of ৳{inv.netPayable?.toLocaleString()}]
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Amount to Collect (৳)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 3500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="bKASH">bKASH Merchant</option>
                  <option value="NAGAD">Nagad</option>
                  <option value="ROCKET">Rocket</option>
                  <option value="CASH">Cash Desk</option>
                  <option value="CARD">Credit/Debit Card POS</option>
                  <option value="BANK">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Reference / Receipt ID (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="e.g. TRX-904812 / Slip #42"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !selectedInvoiceId}>
                {submitting ? 'Recording...' : 'Confirm Payment'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
