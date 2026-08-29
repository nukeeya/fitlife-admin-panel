import { Plus, Users } from 'lucide-react';
import { trainers } from '../data/gymData';

export default function Trainers() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">TRAINERS</h1>
          <p className="page-subtitle">{trainers.length} ACTIVE TRAINERS</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary">
            <Plus size={16} /> ADD TRAINER
          </button>
        </div>
      </div>

      <div className="trainers-grid">
        {trainers.map((t) => (
          <div key={t.id} className="trainer-card">
            <div className="trainer-avatar">{t.avatar}</div>
            <h3 className="trainer-name">{t.name}</h3>
            <p className="trainer-role">{t.role}</p>
            <div className="trainer-meta">
              <div className="trainer-stat">
                <Users size={14} />
                <span>{t.clients} CLIENTS</span>
              </div>
              <span
                className={`trainer-status ${t.available ? 'available' : 'unavailable'}`}
              >
                ● {t.available ? 'AVAILABLE' : 'UNAVAILABLE'}
              </span>
            </div>
            <p className="trainer-specialty">{t.specialty}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
