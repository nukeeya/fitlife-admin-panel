import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { members as fallbackMembers } from '../data/gymData';

export default function Members() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const openAdmission = outletContext?.openAdmission || (() => {});
  const { members: liveMembers } = useGymData();
  const allMembers = liveMembers || fallbackMembers;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');

  const filtered = allMembers.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || m.status?.toLowerCase() === statusFilter.toLowerCase();
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

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>PLAN</th>
              <th>JOINED</th>
              <th>EXPIRY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="clickable-row"
                onClick={() => navigate(`/members/${m.id}`)}
              >
                <td>
                  <div className="member-cell">
                    <div className="avatar">{m.avatar}</div>
                    {m.name}
                  </div>
                </td>
                <td>{m.plan}</td>
                <td>{m.joined}</td>
                <td>{m.expiry}</td>
                <td>
                  <span className={`status-badge ${m.status.toLowerCase()}`}>
                    ● {m.status.toUpperCase()}
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
