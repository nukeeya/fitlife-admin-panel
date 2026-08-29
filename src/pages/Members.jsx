import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus } from 'lucide-react';
import { members } from '../data/gymData';

export default function Members() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

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
