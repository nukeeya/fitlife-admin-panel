import { useState, useEffect } from 'react';
import { Plus, Users, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainers();
  }, []);

  async function fetchTrainers() {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      setTrainers(data.map(t => ({
        id: t.id,
        name: `${t.first_name} ${t.last_name}`,
        avatar: `${t.first_name?.[0]}${t.last_name?.[0]}`,
        role: t.role,
        specialty: t.specialty,
        clients: t.clients,
        available: t.available,
      })));
    }
    setLoading(false);
  }

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
