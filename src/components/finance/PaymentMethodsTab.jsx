import { useState, useMemo } from 'react';
import { CreditCard, Search } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBDT, formatDatePretty } from '../../utils/financeCalculators';
import FinanceDateFilterBar from './FinanceDateFilterBar';
import InvoiceViewModal from './modals/InvoiceViewModal';

export default function PaymentMethodsTab() {
  const { paymentMethodSummary, filteredPayments, filteredRefunds, invoices } = useFinance();

  const [activeViewMode, setActiveViewMode] = useState('combined'); // 'combined' | 'individual'
  const [selectedMethodId, setSelectedMethodId] = useState('BKASH');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);

  // Consolidated total
  const consolidatedTotal = paymentMethodSummary.reduce((s, m) => s + m.totalAmount, 0);
  const consolidatedRefunds = paymentMethodSummary.reduce((s, m) => s + m.refundAmount, 0);
  const consolidatedNet = Math.max(0, consolidatedTotal - consolidatedRefunds);
  const consolidatedCount = paymentMethodSummary.reduce((s, m) => s + m.count, 0);

  // Current method in Individual View
  const activeMethod = useMemo(() => {
    return paymentMethodSummary.find((m) => m.id === selectedMethodId) || paymentMethodSummary[0];
  }, [paymentMethodSummary, selectedMethodId]);

  // Transactions for selected individual method
  const individualTransactions = useMemo(() => {
    if (!activeMethod) return [];
    return filteredPayments.filter(
      (p) => p.methodId === activeMethod.id || p.method?.toLowerCase() === activeMethod.name.toLowerCase()
    ).filter((p) => {
      return (
        p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [activeMethod, filteredPayments, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <FinanceDateFilterBar showReset={false} />

      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-base)',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 800 }}>Payment Gateway & Channels:</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Cash, bKash, Nagad, Rocket, Bank Transfer
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeViewMode === 'combined' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveViewMode('combined')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Combined Consolidated View
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeViewMode === 'individual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveViewMode('individual')}
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Individual Channel View
          </button>
        </div>
      </div>

      {/* VIEW 1: COMBINED CONSOLIDATED VIEW */}
      {activeViewMode === 'combined' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Consolidated KPI Bar */}
          <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            <div className="stat-widget">
              <span className="stat-widget-title">Consolidated Total Collected</span>
              <div className="stat-widget-value" style={{ color: '#10B981' }}>
                {formatBDT(consolidatedTotal)}
              </div>
              <div className="stat-widget-sub">Across all 5 payment channels</div>
            </div>

            <div className="stat-widget">
              <span className="stat-widget-title">Total Transaction Count</span>
              <div className="stat-widget-value primary-highlight">
                {consolidatedCount} Transactions
              </div>
              <div className="stat-widget-sub">All receipts received in scope</div>
            </div>

            <div className="stat-widget">
              <span className="stat-widget-title">Total Refund Clawbacks</span>
              <div className="stat-widget-value" style={{ color: 'var(--danger)' }}>
                {formatBDT(consolidatedRefunds)}
              </div>
              <div className="stat-widget-sub">Clawed back via gateways</div>
            </div>

            <div className="stat-widget">
              <span className="stat-widget-title">Net Bankable Liquid Receipts</span>
              <div className="stat-widget-value" style={{ color: '#10B981' }}>
                {formatBDT(consolidatedNet)}
              </div>
              <div className="stat-widget-sub">Collections minus refunds</div>
            </div>
          </div>

          {/* Cards for each payment method */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '14px',
          }}>
            {paymentMethodSummary.map((method) => {
              const share = consolidatedTotal > 0 ? (method.totalAmount / consolidatedTotal) * 100 : 0;
              return (
                <div
                  key={method.id}
                  className="activity-card"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    setActiveViewMode('individual');
                  }}
                  title={`Click to view all ${method.name} transactions`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: method.color }} />
                      <strong style={{ fontSize: '14px' }}>{method.name}</strong>
                    </div>
                    <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                      {share.toFixed(1)}% Share
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {method.accountNumber} • Fee: {method.feePercent}%
                  </div>

                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981', marginBottom: '8px' }}>
                    {formatBDT(method.totalAmount)}
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    borderTop: '1px solid var(--border-base)',
                    paddingTop: '8px',
                  }}>
                    <span>{method.count} Transactions</span>
                    <span>Refunds: {formatBDT(method.refundAmount)}</span>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>Net: {formatBDT(method.netCollection)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Consolidated Method Breakdown Table */}
          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>Channel Financial Ledger Breakdown</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reconciled against bank & MFS statements</span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Account / Gateway Ref</th>
                    <th>Fee Structure</th>
                    <th>Transaction Count</th>
                    <th>Gross Collected</th>
                    <th>Refunds</th>
                    <th>Net Collected</th>
                    <th>Share %</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethodSummary.map((m) => {
                    const share = consolidatedTotal > 0 ? (m.totalAmount / consolidatedTotal) * 100 : 0;
                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: m.color }} />
                            <strong style={{ fontSize: '13px' }}>{m.name}</strong>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px' }}>{m.accountNumber}</td>
                        <td>{m.feePercent}% Gateway Charge</td>
                        <td style={{ fontWeight: 700 }}>{m.count}</td>
                        <td style={{ fontWeight: 800, color: '#10B981' }}>{formatBDT(m.totalAmount)}</td>
                        <td style={{ color: m.refundAmount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {m.refundAmount > 0 ? formatBDT(m.refundAmount) : '৳0'}
                        </td>
                        <td style={{ fontWeight: 800, color: '#10B981' }}>{formatBDT(m.netCollection)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '50px', height: '6px', background: 'var(--border-base)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${share}%`, height: '100%', background: m.color }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600 }}>{share.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedMethodId(m.id);
                              setActiveViewMode('individual');
                            }}
                            style={{ fontSize: '11px', padding: '3px 8px' }}
                          >
                            Inspect Ledger
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INDIVIDUAL METHOD VIEW */}
      {activeViewMode === 'individual' && activeMethod && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Method selector pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {paymentMethodSummary.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`btn btn-sm ${selectedMethodId === m.id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedMethodId(m.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color }} />
                {m.name} ({m.count})
              </button>
            ))}
          </div>

          {/* Individual method KPI header card */}
          <div className="activity-card" style={{ padding: '18px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid var(--border-base)',
              paddingBottom: '14px',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: activeMethod.color }} />
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                    {activeMethod.name} — Dedicated Channel Ledger
                  </h2>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {activeMethod.accountNumber} • {activeMethod.type} • Fee: {activeMethod.feePercent}%
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-success" style={{ fontSize: '12px' }}>
                  Channel Verified Active
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}>
              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Total Collected</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>{formatBDT(activeMethod.totalAmount)}</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Transaction Count</span>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>{activeMethod.count}</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Refunds Issued</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--danger)' }}>{formatBDT(activeMethod.refundAmount)}</span>
              </div>
              <div style={{ padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Net Liquid Settled</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }}>{formatBDT(activeMethod.netCollection)}</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${activeMethod.name} transactions...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px', fontSize: '12px' }}
            />
          </div>

          {/* Transactions list table */}
          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>
                {activeMethod.name} Transaction Log ({individualTransactions.length})
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Filtered by selected reporting scope
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Invoice No</th>
                    <th>Member Name</th>
                    <th>Member Code</th>
                    <th>Trx / Bank Reference</th>
                    <th>Amount Received</th>
                    <th>Date Received</th>
                    <th>Notes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {individualTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No transactions recorded via {activeMethod.name} for the current filter.
                      </td>
                    </tr>
                  ) : (
                    individualTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 800, color: 'var(--primary)' }}>{tx.receiptNumber}</td>
                        <td>
                          <span
                            style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)', fontWeight: 600 }}
                            onClick={() => {
                              const inv = invoices.find((i) => i.id === tx.invoiceId);
                              if (inv) setViewInvoice(inv);
                            }}
                          >
                            {tx.invoiceNumber}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{tx.memberName}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tx.memberCode}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{tx.reference || '—'}</td>
                        <td style={{ fontWeight: 800, color: '#10B981', fontSize: '14px' }}>{formatBDT(tx.amount)}</td>
                        <td style={{ fontSize: '12px' }}>{formatDatePretty(tx.date)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tx.notes || '—'}</td>
                        <td><span className="badge badge-success">Settled</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <InvoiceViewModal
        isOpen={Boolean(viewInvoice)}
        onClose={() => setViewInvoice(null)}
        invoice={viewInvoice}
      />
    </div>
  );
}
