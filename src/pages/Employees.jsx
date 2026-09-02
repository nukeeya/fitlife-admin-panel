import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { employees } from '../data/gymData';

export default function Employees() {
  const [search, setSearch] = useState('');

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Employee Management & Staff Roster</h1>
          <p className="page-subtitle">
            Front desk, operations, maintenance, finance staff records, and monthly payroll budget overview.
          </p>
        </div>
      </div>

      {/* Filter and Stats */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
        <div className="header-search" style={{ width: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search employee name or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Reception', 'Operations', 'Finance', 'Maintenance', 'Marketing'].map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${deptFilter === d ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDeptFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="badge badge-primary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          Total Staff Payroll: ৳{totalPayroll.toLocaleString()} / mo
        </div>
      </div>

      {/* Employee Table */}
      <div className="activity-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Staff Profile</th>
                <th>Role & Department</th>
                <th>Contact</th>
                <th>Joined Date</th>
                <th>Monthly Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="member-cell">
                      <div className="avatar-initials">{e.avatar}</div>
                      <div className="member-cell-info">
                        <span className="member-cell-name">{e.name}</span>
                        <span className="member-cell-code">{e.code}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{e.role}</span>
                      <span style={{ fontSize: '11px', color: 'var(--primary)' }}>{e.department}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px' }}>
                      <span>{e.phone}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{e.email}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{e.joined}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                    ৳{e.salary.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                      {e.status}
                    </span>
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
