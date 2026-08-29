import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Calendar, CreditCard, CheckCircle } from 'lucide-react';
import { members } from '../data/gymData';

export default function MemberDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const member = members.find((m) => m.id === Number(id));

  if (!member) {
    return (
      <div className="page">
        <p style={{ color: 'var(--gray)' }}>Member not found.</p>
      </div>
    );
  }

  const paymentHistory = [
    { date: member.joined, amount: member.plan === 'Premium' ? '৳5,000' : member.plan === 'Standard' ? '৳3,000' : '৳2,000', method: 'bKASH', status: 'Paid' },
    { date: '12 JUL', amount: member.plan === 'Premium' ? '৳5,000' : member.plan === 'Standard' ? '৳3,000' : '৳2,000', method: 'CASH', status: 'Paid' },
    { date: '12 JUN', amount: member.plan === 'Premium' ? '৳5,000' : member.plan === 'Standard' ? '৳3,000' : '৳2,000', method: 'CARD', status: 'Paid' },
  ];

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/members')}>
        <ArrowLeft size={18} /> BACK TO MEMBERS
      </button>

      <h1 className="page-title">MEMBER PROFILE</h1>

      <div className="member-profile-grid">
        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-top">
            <div className="avatar-large">{member.avatar}</div>
            <div className="profile-info">
              <h2 className="profile-name">{member.name}</h2>
              <p className="profile-plan">{member.plan} Member</p>
              <span className={`status-badge ${member.status.toLowerCase()}`}>
                ● {member.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">PLAN</span>
              <span className="info-value">{member.plan}</span>
            </div>
            <div className="info-item">
              <span className="info-label">JOINED</span>
              <span className="info-value">{member.joined} 2026</span>
            </div>
            <div className="info-item">
              <span className="info-label">EXPIRES</span>
              <span className="info-value">{member.expiry} 2026</span>
            </div>
            <div className="info-item">
              <span className="info-label">ATTENDANCE</span>
              <span className="info-value">{member.visits} VISITS</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label">PHONE</span>
              <span className="info-value">{member.phone}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="table-card">
          <div className="table-header">
            <h2 className="chart-title">PAYMENT HISTORY</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>DATE</th>
                <th>AMOUNT</th>
                <th>METHOD</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((p, i) => (
                <tr key={i}>
                  <td>{p.date}</td>
                  <td>{p.amount}</td>
                  <td>{p.method}</td>
                  <td>
                    <span className="status-badge active">● {p.status.toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
