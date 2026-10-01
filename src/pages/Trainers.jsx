import { useState } from 'react';
import {
  Plus,
  Users,
  Search,
  Star,
  Phone,
  Edit,
  Trash2,
  CheckCircle2,
  Dumbbell,
  UserPlus,
  X,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { supabase } from '../lib/supabase';
import Modal from '../components/common/Modal';

export default function Trainers() {
  const { trainers: liveTrainers, members: liveMembers, refresh } = useGymData();
  const allTrainers = liveTrainers || [];
  const members = liveMembers || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  // Trainer Add / Edit Modals
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  // Member assignment to trainer
  const [memberToAssignId, setMemberToAssignId] = useState('');

  const initialForm = {
    name: '',
    specialty: 'Strength & Conditioning',
    phone: '',
    email: '',
    rating: '5.0',
    salary: '',
    available: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const filtered = allTrainers.filter(
    (t) =>
      t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone?.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingTrainer(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTrainer(t);
    setFormData({
      name: t.name || '',
      specialty: t.specialty || 'Strength & Conditioning',
      phone: t.phone || '',
      email: t.email || '',
      rating: String(t.rating || '5.0'),
      salary: t.salary || '',
      available: t.available !== false,
    });
    setShowModal(true);
  };

  const handleSaveTrainer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTrainer) {
        const { error } = await supabase
          .from('trainers')
          .update({
            name: formData.name.trim(),
            specialty: formData.specialty,
            phone: formData.phone.trim(),
            email: formData.email.trim() || null,
            rating: Number(formData.rating) || 5.0,
            monthly_salary: Number(formData.salary) || 0,
            is_available: formData.available,
          })
          .eq('id', editingTrainer.id);

        if (error) throw error;
        setNotice(`Coach profile for "${formData.name}" updated successfully.`);
      } else {
        const avatar = formData.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase() || 'TR';

        const { error } = await supabase.from('trainers').insert({
          name: formData.name.trim(),
          specialty: formData.specialty,
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          rating: Number(formData.rating) || 5.0,
          monthly_salary: Number(formData.salary) || 0,
          is_available: formData.available,
          avatar,
        });

        if (error) throw error;
        setNotice(`New certified coach "${formData.name}" added to staff roster.`);
      }

      await refresh();
      setShowModal(false);
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.error('Save trainer error:', err);
      alert('Failed to save coach profile. Check console.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrainer = async (t) => {
    if (window.confirm(`Are you sure you want to remove coach "${t.name}"?`)) {
      try {
        const { error } = await supabase.from('trainers').delete().eq('id', t.id);
        if (error) throw error;
        await refresh();
        setNotice(`Coach "${t.name}" was removed.`);
        setTimeout(() => setNotice(''), 3000);
      } catch (err) {
        console.error('Delete trainer error:', err);
        alert('Could not remove coach profile.');
      }
    }
  };

  // Client allocation handlers
  const handleAssignMember = async () => {
    if (!memberToAssignId || !selectedTrainer) return;
    try {
      const { error } = await supabase
        .from('members')
        .update({ trainer_id: selectedTrainer.id })
        .eq('id', Number(memberToAssignId));

      if (error) throw error;
      await refresh();
      setMemberToAssignId('');
    } catch (err) {
      console.error('Assign member failed:', err);
      alert('Could not assign member to trainer.');
    }
  };

  const handleUnassignMember = async (memberId) => {
    try {
      const { error } = await supabase
        .from('members')
        .update({ trainer_id: null })
        .eq('id', Number(memberId));

      if (error) throw error;
      await refresh();
    } catch (err) {
      console.error('Unassign member failed:', err);
      alert('Could not unassign member.');
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Personal Trainer & Coaching Staff</h1>
          <p className="page-subtitle">
            Coach profiles, client roster allocations, specialties, ratings, and schedule assignments.
          </p>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Coach / Trainer
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10B981',
            color: '#10B981',
            padding: '12px 18px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      {/* Search & Stats */}
      <div
        style={{
          background: 'var(--bg-card)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div className="header-search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search coach, specialty, phone..."
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
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-base)' }}>
            No coaches found matching your criteria.
          </div>
        ) : (
          filtered.map((t) => {
            const clientCount = members.filter((m) => m.trainer === t.name).length;
            return (
              <div key={t.id} className="trainer-card">
                <div className="trainer-header">
                  <div className="avatar-initials" style={{ width: '48px', height: '48px', fontSize: '16px' }}>
                    {t.avatar || t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>{t.name}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>{t.specialty}</span>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(234, 179, 8, 0.12)', padding: '4px 8px', borderRadius: '6px' }}>
                    <Star size={14} color="#EAB308" fill="#EAB308" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#EAB308' }}>{t.rating || 5.0}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div><strong>Specialty:</strong> {t.specialty}</div>
                  <div><strong>Active Clients:</strong> {clientCount} Assigned</div>
                  <div><strong>Phone:</strong> {t.phone}</div>
                  <div><strong>Email:</strong> {t.email || 'N/A'}</div>
                  {t.salary > 0 && <div><strong>Monthly Retainer:</strong> ৳{Number(t.salary).toLocaleString()}</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-base)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setSelectedTrainer(t)}
                  >
                    <Users size={14} /> Clients ({clientCount})
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(t)}
                    title="Edit Profile"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteTrainer(t)}
                    title="Remove Coach"
                  >
                    <Trash2 size={14} />
                  </button>

                  <span className={`badge ${t.available ? 'badge-success' : 'badge-danger'}`} style={{ alignSelf: 'center' }}>
                    {t.available ? 'Available' : 'Booked'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Coach Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTrainer ? `Edit Coach: ${editingTrainer.name}` : 'Add Certified Personal Trainer'}
        subtitle="Manage fitness specialties, client capacity, and compensation"
        icon={Dumbbell}
        size="md"
      >
        <form onSubmit={handleSaveTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Coach Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Tanvir Rahman"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Specialty & Discipline</label>
              <select
                className="form-select"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              >
                <option value="Strength & Conditioning">Strength & Conditioning</option>
                <option value="Cardio & HIIT">Cardio & HIIT</option>
                <option value="Yoga & Flexibility">Yoga & Flexibility</option>
                <option value="CrossFit & Functional">CrossFit & Functional</option>
                <option value="Nutrition & Diet">Nutrition & Diet</option>
                <option value="MMA & Self Defense">MMA & Self Defense</option>
                <option value="Pilates & Core">Pilates & Core</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1712-..."
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="coach@fitlife.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Retainer (৳)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="e.g. 35000"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Coach Rating (1.0 to 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                className="form-input"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Accepting New Clients</label>
              <select
                className="form-select"
                value={formData.available ? 'yes' : 'no'}
                onChange={(e) => setFormData({ ...formData, available: e.target.value === 'yes' })}
              >
                <option value="yes">Available (Open for bookings)</option>
                <option value="no">Booked / Full Roster</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingTrainer ? 'Update Profile' : 'Add Coach'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Trainer Clients Allocation Modal */}
      <Modal
        isOpen={Boolean(selectedTrainer)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Member Allocation Bar */}
            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-base)', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                className="form-select"
                value={memberToAssignId}
                onChange={(e) => setMemberToAssignId(e.target.value)}
                style={{ flex: 1, fontSize: '13px' }}
              >
                <option value="">Select active member to assign...</option>
                {members
                  .filter((m) => m.trainer !== selectedTrainer.name && m.status === 'Active')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code} - {m.plan}) {m.trainer !== 'None' ? `[Current: ${m.trainer}]` : ''}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!memberToAssignId}
                onClick={handleAssignMember}
              >
                <UserPlus size={14} /> Assign
              </button>
            </div>

            {members.filter((m) => m.trainer === selectedTrainer.name).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                <Users size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No members currently assigned to this coach.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Select an active member above to allocate them to {selectedTrainer.name}.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
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
                        padding: '10px 14px',
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="badge badge-success">{m.status}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px', color: 'var(--danger)' }}
                          onClick={() => handleUnassignMember(m.id)}
                          title="Unassign from coach"
                        >
                          <X size={14} />
                        </button>
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
