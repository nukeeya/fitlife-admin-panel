import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Key,
  Dumbbell,
  CheckCircle2,
  Clock,
  Tag,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function MemberDetails() {
  const { id } = useParams();
  const { members, invoices, attendance, checkInMember } = useGymData();

  const member = members.find((m) => m.id === Number(id)) || members[0];
  const memberInvoices = invoices.filter((i) => i.memberId === member?.id);
  const memberAttendance = attendance.filter((a) => a.memberId === member?.id);

  if (!member) {
    return (
      <div className="page">
        <Link to="/members" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Members
        </Link>
        <p>Member not found.</p>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/members" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="page-title-group">
            <h1 className="page-title">{member.name}</h1>
            <p className="page-subtitle">
              {member.code} • {member.gender} • Registered on {member.joined}
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => checkInMember(member.id)}>
          <CheckCircle2 size={16} /> Check In Today
        </button>
      </div>

      {/* Member Profile Summary Cards */}
      <div className="dashboard-metrics-grid">
        <div className="stat-widget">
          <span className="stat-widget-title">Membership Plan</span>
          <div className="stat-widget-value primary-highlight">{member.plan}</div>
          <div className="stat-widget-sub">Exp: {member.expiry}</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Assigned Locker</span>
          <div className="stat-widget-value">{member.lockerNumber || 'None'}</div>
          <div className="stat-widget-sub">Dedicated storage</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Personal Trainer</span>
          <div className="stat-widget-value">{member.trainer || 'None'}</div>
          <div className="stat-widget-sub">Assigned coach</div>
        </div>

        <div className="stat-widget">
          <span className="stat-widget-title">Total Gym Visits</span>
          <div className="stat-widget-value" style={{ color: '#10B981' }}>{member.visits} Sessions</div>
          <div className="stat-widget-sub">Check-in telemetry</div>
        </div>
      </div>

      {/* Member Invoices & Discount History */}
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Billing Invoices & Discount History</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Plan Name</th>
                <th>Base Price</th>
                <th>Discount Applied</th>
                <th>Tax</th>
                <th>Net Payable</th>
                <th>Paid Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {memberInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No invoice records found for this member.
                  </td>
                </tr>
              ) : (
                memberInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.number}</td>
                    <td>{inv.planName}</td>
                    <td>৳{inv.baseAmount.toLocaleString()}</td>
                    <td>
                      {inv.discountAmount > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                          - ৳{inv.discountAmount} ({inv.discountReason})
                        </span>
                      ) : (
                        'None'
                      )}
                    </td>
                    <td>৳{inv.taxAmount}</td>
                    <td style={{ fontWeight: 800 }}>৳{inv.netPayable.toLocaleString()}</td>
                    <td style={{ color: '#10B981', fontWeight: 700 }}>৳{inv.paidAmount.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
