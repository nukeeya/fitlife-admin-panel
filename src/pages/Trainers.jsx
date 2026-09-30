import { useState } from 'react';
import { Plus, Users, Search, Star, Award, Phone, Mail } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { trainers as fallbackTrainers } from '../data/gymData';
import Modal from '../components/common/Modal';

export default function Trainers() {
  const { trainers: liveTrainers, members: liveMembers } = useGymData();
  const allTrainers = liveTrainers || fallbackTrainers;
  const members = liveMembers || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const filtered = allTrainers.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Personal Trainer Management</h1>
          <p className="page-subtitle">
            Coach profiles, client roster allocations, specialties, ratings, and schedule assignments.
          </p>
        </div>
      </div>

      {/* Search & Stats */}
      <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="header-search" style={{ width: '320px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search coach or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {allTrainers.length} Certified Trainers on Staff
        </span>
      </div>

      {/* Trainers Grid */}
      <div className="trainer-grid">
        {filtered.map((t) => {
          const clientCount = members.filter((m) => m.trainer === t.name).length;
          return (
            <div key={t.id} className="trainer-card">
              <div className="trainer-header">
                <div className="avatar-initials" style={{ width: '48px', height: '48px', fontSize: '16px' }}>
                  {t.avatar}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{t.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{t.role}</span>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(234, 179, 8, 0.12)', padding: '4px 8px', borderRadius: '6px' }}>
                  <Star size={14} color="#EAB308" fill="#EAB308" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#EAB308' }}>{t.rating}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <div><strong>Specialty:</strong> {t.specialty}</div>
                <div><strong>Active Clients:</strong> {clientCount} Assigned</div>
                <div><strong>Phone:</strong> {t.phone}</div>
                <div><strong>Email:</strong> {t.email}</div>
                {t.salary && <div><strong>Monthly Retainer:</strong> ৳{t.salary.toLocaleString()}</div>}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-base)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setSelectedTrainer(t)}
                >
                  <Users size={14} /> View Clients ({clientCount})
                </button>
                <span className={`badge ${t.available ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'center' }}>
                  {t.available ? 'Available' : 'Booked'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Standardized Trainer Clients Modal */}
      <Modal
        isOpen={!!selectedTrainer}
        onClose={() => setSelectedTrainer(null)}
        title={selectedTrainer ? `${selectedTrainer.name}'s Client Roster` : 'Trainer Clients'}
        subtitle={selectedTrainer ? `${selectedTrainer.specialty} • ${selectedTrainer.phone}` : ''}
        icon={Users}
        size="md"
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedTrainer(null)}>
            Close
          </button>
        }
      >
        {selectedTrainer && (
          <div>
            {members.filter((m) => m.trainer === selectedTrainer.name).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No members currently assigned to this trainer.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Assign this trainer during member admission or from the member profile.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Total of {members.filter((m) => m.trainer === selectedTrainer.name).length} member(s) undergoing training:
                </div>
                {members
                  .filter((m) => m.trainer === selectedTrainer.name)
                  .map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--bg-surface)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-base)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-initials">{m.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{m.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {m.code} • {m.plan}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Exp: {m.expiry}</span>
                        <span className="badge badge-success">{m.status}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
