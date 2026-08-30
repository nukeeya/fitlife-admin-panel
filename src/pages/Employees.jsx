import { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Employees() {
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setEmployees(data.map(e => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        avatar: `${e.first_name?.[0]}${e.last_name?.[0]}`,
        role: e.role,
        department: e.department,
        phone: e.phone,
        email: e.email,
        joined: e.joined ? new Date(e.joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—',
        salary: e.salary,
        status: e.status,
      })));
    }
    setLoading(false);
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--lime)' }} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">EMPLOYEES</h1>
          <p className="page-subtitle">{employees.length} TOTAL EMPLOYEES</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary">
            <Plus size={16} /> ADD EMPLOYEE
          </button>
        </div>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>ROLE</th>
              <th>DEPARTMENT</th>
              <th>PHONE</th>
              <th>JOINED</th>
              <th>SALARY</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar">{e.avatar}</div>
                    {e.name}
                  </div>
                </td>
                <td>{e.role}</td>
                <td>{e.department}</td>
                <td>{e.phone}</td>
                <td>{e.joined}</td>
                <td style={{ color: 'var(--white)', fontWeight: 600 }}>
                  {e.salary}
                </td>
                <td>
                  <span
                    className={`status-badge ${e.status === 'Active' ? 'active' : 'expiring'}`}
                  >
                    ● {e.status.toUpperCase()}
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
