import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Dumbbell,
  Key,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function Members() {
  const { openAdmission } = useOutletContext();
  const { members } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesPlan = planFilter === 'All' || m.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Member Management</h1>
          <p className="page-subtitle">
            Comprehensive member registry, dynamic discount audit trail, trainers & locker assignments.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdmission}>
            <Plus size={16} />
            Add New Member
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
        <div className="header-search" style={{ width: '320px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name, code, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['All', 'Active', 'Expiring', 'Expired'].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>PLAN:</span>
            <select
              className="form-select"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="All">All Packages</option>
              <option value="Basic Membership">Basic Membership</option>
              <option value="Standard Fitness">Standard Fitness</option>
              <option value="Premium Pro">Premium Pro</option>
              <option value="Elite VIP Athlete">Elite VIP Athlete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Member Table */}
      <div className="activity-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member Profile</th>
                <th>Contact</th>
                <th>Package & Discount</th>
                <th>Trainer & Locker</th>
                <th>Joined / Expiry</th>
                <th>Visits</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No members found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div className="member-cell">
                        <div className="avatar-initials">{m.avatar}</div>
                        <div className="member-cell-info">
                          <span className="member-cell-name">{m.name}</span>
                          <span className="member-cell-code">{m.code} • {m.gender}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{m.phone}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="badge badge-primary">{m.plan}</span>
                        {m.discountApplied && m.discountApplied !== 'None' && (
                          <span style={{ fontSize: '11px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Tag size={10} /> {m.discountApplied}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Dumbbell size={12} color="var(--primary)" /> {m.trainer || 'None'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Key size={12} /> {m.lockerNumber && m.lockerNumber !== 'None' ? m.lockerNumber : 'No Locker'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                        <span>Joined: {m.joined}</span>
                        <span style={{ color: m.status === 'Expiring' ? 'var(--warning)' : 'var(--text-muted)', fontWeight: m.status === 'Expiring' ? 700 : 400 }}>
                          Exp: {m.expiry}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{m.visits} Check-ins</td>
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'Active'
                            ? 'badge-success'
                            : m.status === 'Expiring'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/members/${m.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={12} />
                        Profile
                      </Link>
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
