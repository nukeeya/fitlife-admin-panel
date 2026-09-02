import { Plus, Users } from 'lucide-react';
import { trainers } from '../data/gymData';

export default function Trainers() {
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

      {/* Search */}
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
          {trainers.length} Certified Trainers on Staff
        </span>
      </div>

      {/* Trainers Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map((t) => {
          const assignedMembers = members.filter((m) => m.trainer === t.name);

          return (
            <div
              key={t.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar-initials" style={{ width: '44px', height: '44px', fontSize: '14px' }}>
                    {t.avatar}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{t.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                      {t.role}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '6px' }}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>{t.rating}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div><strong>Specialty:</strong> {t.specialty}</div>
                <div><strong>Phone:</strong> {t.phone}</div>
                <div><strong>Active Clients:</strong> {assignedMembers.length + t.clients} Members</div>
                <div><strong>Monthly Retainer:</strong> ৳{t.salary.toLocaleString()} / mo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span
                    className={`badge ${t.available ? 'badge-success' : 'badge-danger'}`}
                  >
                    {t.available ? '● Available for Clients' : '● Booked Out'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => setSelectedTrainer(t)}
                >
                  <Users size={14} />
                  View Assigned Clients ({assignedMembers.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trainer Clients Modal */}
      {selectedTrainer && (
        <div className="modal-overlay" onClick={() => setSelectedTrainer(null)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '16px', fontWeight: 800 }}>
                {selectedTrainer.name}'s Client Roster
              </h2>
            </div>
            <div className="modal-body">
              {members.filter((m) => m.trainer === selectedTrainer.name).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No members currently assigned to this trainer.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {members
                    .filter((m) => m.trainer === selectedTrainer.name)
                    .map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-surface)',
                          borderRadius: '8px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{m.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {m.code} • {m.plan}
                          </div>
                        </div>
                        <span className="badge badge-success">{m.status}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTrainer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
