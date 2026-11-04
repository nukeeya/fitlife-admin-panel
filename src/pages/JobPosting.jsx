import { useState } from 'react';
import { AlertCircle, Briefcase, Eye, Plus, Trash2, User, UserPlus } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from '../components/common/Modal';
import DataState from '../components/common/DataState';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Must match the job_applications status check (migration 020).
const STAGES = ['Applied', 'Screened', 'Shortlisted', 'Interview', 'Hired', 'Rejected'];
const STAGE_BADGE = {
  Applied: 'badge-info',
  Screened: 'badge-info',
  Shortlisted: 'badge-primary',
  Interview: 'badge-warning',
  Hired: 'badge-success',
  Rejected: 'badge-danger',
};

// job_postings.job_type check (schema.sql).
const JOB_TYPES = ['Full Time', 'Part Time', 'Contract'];
const DEPARTMENTS = [
  'Fitness & Training',
  'Front Desk & Reception',
  'Operations & Floor',
  'Nutrition & Dietetics',
  'Maintenance & Hygiene',
];

const EMPTY_JOB = { title: '', department: DEPARTMENTS[0], type: JOB_TYPES[0], salary: '', vacancies: '1', description: '' };
const EMPTY_APPLICANT = { jobId: '', name: '', phone: '', email: '', experienceYears: '', notes: '' };

const errorBoxStyle = {
  padding: '10px 14px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid var(--danger)',
  color: 'var(--danger)',
  fontSize: '12px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const formatExperience = (years) => (years == null ? '—' : `${years} yr${years === 1 ? '' : 's'}`);

export default function JobPosting() {
  const {
    jobs,
    addJob,
    updateJob,
    jobApplications,
    addJobApplication,
    updateJobApplication,
    deleteJobApplication,
    loading,
    loadErrors,
    refresh,
  } = useGymData();

  const openJobs = jobs.filter((j) => j.status === 'Open');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Post vacancy
  const [showJobModal, setShowJobModal] = useState(false);
  const [newJob, setNewJob] = useState(EMPTY_JOB);

  // Add applicant
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [newApplicant, setNewApplicant] = useState(EMPTY_APPLICANT);

  // Review applicant: keep only the id so the dialog always shows the saved row.
  const [selectedId, setSelectedId] = useState(null);
  const selected = jobApplications.find((a) => a.id === selectedId) || null;
  const [notesDraft, setNotesDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const openJobModal = () => {
    setNewJob(EMPTY_JOB);
    setFormError('');
    setShowJobModal(true);
  };

  const openApplicantModal = (jobId = '') => {
    setNewApplicant({ ...EMPTY_APPLICANT, jobId: String(jobId || openJobs[0]?.id || '') });
    setFormError('');
    setShowApplicantModal(true);
  };

  const openReview = (applicant) => {
    setSelectedId(applicant.id);
    setNotesDraft(applicant.notes);
    setFormError('');
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim()) return;
    setSaving(true);
    const { error } = await addJob(newJob);
    setSaving(false);
    if (error) {
      setFormError(error.message || 'Could not post the vacancy. Please try again.');
      return;
    }
    setShowJobModal(false);
  };

  const handleToggleJob = async (job) => {
    setSaving(true);
    const { error } = await updateJob(job.id, { status: job.status === 'Open' ? 'Closed' : 'Open' });
    setSaving(false);
    if (error) window.alert(error.message || 'Could not update the vacancy.');
  };

  const handleAddApplicant = async (e) => {
    e.preventDefault();
    if (!newApplicant.jobId || !newApplicant.name.trim() || !newApplicant.phone.trim()) return;
    setSaving(true);
    const { error } = await addJobApplication(newApplicant);
    setSaving(false);
    if (error) {
      setFormError(error.message || 'Could not add the applicant. Please try again.');
      return;
    }
    setShowApplicantModal(false);
  };

  const handleStageChange = async (stage) => {
    if (!selected || selected.status === stage) return;
    setSaving(true);
    setFormError('');
    const { error } = await updateJobApplication(selected.id, { status: stage });
    setSaving(false);
    if (error) setFormError(error.message || 'Could not change the stage.');
  };

  const handleSaveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    setFormError('');
    const { error } = await updateJobApplication(selected.id, { notes: notesDraft });
    setSaving(false);
    if (error) setFormError(error.message || 'Could not save the notes.');
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await deleteJobApplication(selected.id);
    setSaving(false);
    setConfirmDelete(false);
    if (error) {
      setFormError(error.message || 'Could not delete the applicant.');
      return;
    }
    setSelectedId(null);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Job Postings & Recruitment Portal</h1>
          <p className="page-subtitle">
            Publish openings for certified trainers, floor staff, front desk and manage the hiring pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openApplicantModal()}
            disabled={openJobs.length === 0}
            title={openJobs.length === 0 ? 'Post an open vacancy first' : undefined}
          >
            <UserPlus size={16} />
            Add Applicant
          </button>
          <button type="button" className="btn btn-primary" onClick={openJobModal}>
            <Plus size={16} />
            Post New Vacancy
          </button>
        </div>
      </div>

      {/* Vacancies */}
      <DataState
        loading={loading}
        error={loadErrors.jobs}
        isEmpty={jobs.length === 0}
        noun="vacancies"
        onRetry={refresh}
        onAdd={openJobModal}
        addLabel="Post your first vacancy"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {jobs.map((job) => (
            <div
              key={job.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-base)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-card)',
                opacity: job.status === 'Open' ? 1 : 0.7,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <span className="badge badge-primary">{job.department}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{job.title}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{job.type}</span>
                </div>
                <span className={`badge ${job.status === 'Open' ? 'badge-success' : 'badge-warning'}`}>{job.status}</span>
              </div>

              {job.description && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>{job.description}</p>
              )}

              <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '12px' }}>
                <span><strong>Salary:</strong> {job.salary}</span>
                <span><strong>Vacancies:</strong> {job.vacancies}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto' }}>
                <span>Posted: {job.postedDate}</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {job.applicantsCount} {job.applicantsCount === 1 ? 'Candidate' : 'Candidates'} Applied
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {job.status === 'Open' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openApplicantModal(job.id)}>
                    <UserPlus size={12} /> Add Applicant
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleToggleJob(job)}
                  disabled={saving}
                >
                  {job.status === 'Open' ? 'Close Vacancy' : 'Reopen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </DataState>

      {/* Applicants */}
      <div style={{ marginTop: '24px' }}>
        <DataState
          loading={loading}
          error={loadErrors.jobApplications}
          isEmpty={jobApplications.length === 0}
          noun="applicants"
          onRetry={refresh}
          onAdd={openJobs.length > 0 ? () => openApplicantModal() : undefined}
          addLabel="Add your first applicant"
        >
          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>Candidate Applications Pipeline</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {jobApplications.length} {jobApplications.length === 1 ? 'Applicant' : 'Applicants'}
              </span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Applied Position</th>
                    <th>Experience</th>
                    <th>Contact</th>
                    <th>Applied</th>
                    <th>Stage</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobApplications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 700 }}>{app.name}</td>
                      <td>{app.jobTitle}</td>
                      <td>{formatExperience(app.experienceYears)}</td>
                      <td>{app.phone}</td>
                      <td>{app.appliedDate}</td>
                      <td>
                        <span className={`badge ${STAGE_BADGE[app.status] || 'badge-info'}`}>{app.status}</span>
                      </td>
                      <td>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => openReview(app)}>
                          <Eye size={12} /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DataState>
      </div>

      {/* Post New Vacancy */}
      <Modal
        isOpen={showJobModal}
        onClose={() => !saving && setShowJobModal(false)}
        title="Post New Staff Vacancy"
        subtitle="Create a new job circular for trainers, front desk or facility operations"
        icon={Briefcase}
        size="md"
      >
        <form onSubmit={handleCreateJob}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Position / Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Pilates & Mobility Instructor"
                className="form-input"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select
                  className="form-select"
                  value={newJob.department}
                  onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select
                  className="form-select"
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Salary Range / Compensation</label>
                <input
                  type="text"
                  placeholder="e.g. ৳40,000 - ৳55,000 / month"
                  className="form-input"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Open Positions</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={newJob.vacancies}
                  onChange={(e) => setNewJob({ ...newJob, vacancies: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Job Overview & Requirements</label>
              <textarea
                rows="3"
                placeholder="Key certifications (ACE, ISSA), shift timings, client handling..."
                className="form-textarea"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              />
            </div>

            {formError && (
              <div style={errorBoxStyle} role="alert">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowJobModal(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Publishing…' : 'Publish Opening'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Applicant */}
      <Modal
        isOpen={showApplicantModal}
        onClose={() => !saving && setShowApplicantModal(false)}
        title="Add Applicant"
        subtitle="A candidate who applied by phone, walk-in or social media"
        icon={UserPlus}
        size="md"
      >
        <form onSubmit={handleAddApplicant}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Applying For *</label>
              <select
                required
                className="form-select"
                value={newApplicant.jobId}
                onChange={(e) => setNewApplicant({ ...newApplicant, jobId: e.target.value })}
              >
                {openJobs.map((j) => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newApplicant.name}
                  onChange={(e) => setNewApplicant({ ...newApplicant, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="01XXXXXXXXX"
                  className="form-input"
                  value={newApplicant.phone}
                  onChange={(e) => setNewApplicant({ ...newApplicant, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newApplicant.email}
                  onChange={(e) => setNewApplicant({ ...newApplicant, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  className="form-input"
                  value={newApplicant.experienceYears}
                  onChange={(e) => setNewApplicant({ ...newApplicant, experienceYears: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                rows="3"
                placeholder="Certifications, where they heard about the job, first impression..."
                className="form-textarea"
                value={newApplicant.notes}
                onChange={(e) => setNewApplicant({ ...newApplicant, notes: e.target.value })}
              />
            </div>

            {formError && (
              <div style={errorBoxStyle} role="alert">
                <AlertCircle size={14} /> {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowApplicantModal(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Add Applicant'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Review Applicant */}
      <Modal
        isOpen={!!selected}
        onClose={() => !saving && setSelectedId(null)}
        title={selected ? `Candidate: ${selected.name}` : 'Applicant Review'}
        subtitle={selected ? `Applying for ${selected.jobTitle}` : ''}
        icon={User}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ color: 'var(--danger)' }}
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
            >
              <Trash2 size={14} /> Delete
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setSelectedId(null)} disabled={saving}>
              Done
            </button>
          </div>
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-base)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div><strong>Phone:</strong> {selected.phone}</div>
              <div><strong>Email:</strong> {selected.email || '—'}</div>
              <div><strong>Experience:</strong> {formatExperience(selected.experienceYears)}</div>
              <div><strong>Applied:</strong> {selected.appliedDate}</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Stage:</strong>{' '}
                <span className={`badge ${STAGE_BADGE[selected.status] || 'badge-info'}`}>{selected.status}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Move Recruitment Stage</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className={`btn btn-sm ${selected.status === stage ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStageChange(stage)}
                    disabled={saving}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Recruiter Evaluation Notes</label>
              <textarea
                rows="4"
                className="form-textarea"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveNotes}
                  disabled={saving || notesDraft.trim() === selected.notes}
                >
                  {saving ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            </div>

            {formError && (
              <div style={errorBoxStyle} role="alert">
                <AlertCircle size={14} /> {formError}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete applicant?"
        message={selected ? `${selected.name} will be removed permanently. Use "Rejected" instead to keep a record.` : ''}
        confirmText="Delete"
        type="danger"
        isLoading={saving}
      />
    </div>
  );
}
