import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Members() {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  }

  const filtered = members.filter((m) =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="page-title">MEMBERS</h1>
          <p className="page-subtitle">{members.length} TOTAL MEMBERS</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-outline">
            <Filter size={16} /> FILTER
          </button>
          <button className="btn-primary">
            <Plus size={16} /> ADD MEMBER
          </button>
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
                    <div className="avatar">
                      {m.first_name?.[0]}{m.last_name?.[0]}
                    </div>
                    {m.first_name} {m.last_name}
                  </div>
                </td>
                <td>{m.plan}</td>
                <td>{m.joined ? new Date(m.joined).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() : '—'}</td>
                <td>{m.expiry ? new Date(m.expiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase() : '—'}</td>
                <td>
                  <span className={`status-badge ${m.status?.toLowerCase()}`}>
                    ● {m.status?.toUpperCase()}
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
