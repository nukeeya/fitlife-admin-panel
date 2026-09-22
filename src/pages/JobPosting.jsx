import { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  User,
  Phone,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from '../components/common/Modal';

export default function JobPosting() {
  const { jobs } = useGymData();
  const [jobList, setJobList] = useState(jobs);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // New Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Fitness & Training',
    salary: '৳35,000 - ৳50,000',
    vacancies: '2',
    description: '',
  });

  const [applicants, setApplicants] = useState([
    { id: 1, name: 'Shahidul Alam', role: 'Certified Female Fitness Trainer', exp: '3.5 yrs', status: 'Shortlisted', phone: '+880 1711-998877', notes: 'Certified ACE personal trainer with strong client transformation portfolio.' },
    { id: 2, name: 'Farzana Yesmin', role: 'Front Desk & Guest Relations Executive', exp: '2 yrs', status: 'Interview', phone: '+880 1833-221144', notes: 'Previous experience in hospitality front desk and gym membership CRM systems.' },
    { id: 3, name: 'Dr. Tariqul Islam', role: 'Sports Physiotherapist & Rehab Specialist', exp: '5 yrs', status: 'Screened', phone: '+880 1911-332211', notes: 'BSc in Physical Therapy, specializes in posture correction and recovery protocols.' },
    { id: 4, name: 'Mahmudur Rahman', role: 'Front Desk & Guest Relations Executive', exp: '1 yr', status: 'Applied', phone: '+880 1677-445566', notes: 'Enthusiastic candidate with solid computer literacy and communication skills.' },
  ]);

  const handleCreateJob = (e) => {
    e.preventDefault();
    if (!newJob.title.trim()) return;

    const created = {
      id: Date.now(),
      title: newJob.title.trim(),
      department: newJob.department,
      salary: newJob.salary,
      vacancies: `${newJob.vacancies} Position(s)`,
      description: newJob.description || 'Full-time role contributing to gym member satisfaction and facility operations.',
      status: 'Active',
      postedDate: new Date().toISOString().split('T')[0],
      applicantsCount: 0,
    };

    setJobList((prev) => [created, ...prev]);
    setShowAddJobModal(false);
    setNewJob({
      title: '',
      department: 'Fitness & Training',
      salary: '৳35,000 - ৳50,000',
      vacancies: '2',
      description: '',
    });
  };

  const handleUpdateApplicantStatus = (appId, newStatus) => {
    setApplicants((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selectedApplicant && selectedApplicant.id === appId) {
      setSelectedApplicant((prev) => ({ ...prev, status: newStatus }));
    }
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

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddJobModal(true)}
        >
          <Plus size={16} />
          + Post New Vacancy
        </button>
      </div>

      {/* Active Openings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {jobList.map((job) => (
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
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-primary">{job.department}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '4px' }}>{job.title}</h3>
              </div>
              <span className="badge badge-success">{job.status}</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{job.description}</p>

            <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span><strong>Salary:</strong> {job.salary}</span>
              <span><strong>Vacancies:</strong> {job.vacancies}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: 'auto' }}>
              <span>Posted: {job.postedDate}</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                {job.applicantsCount} Candidates Applied
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Pipeline Table */}
      <div className="activity-card" style={{ marginTop: '24px' }}>
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Recent Candidate Applications Pipeline</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {applicants.length} Active Applicants
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
                <th>Status Stage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.id}>
                  <td style={{ fontWeight: 700 }}>{app.name}</td>
                  <td>{app.role}</td>
                  <td>{app.exp}</td>
                  <td>{app.phone}</td>
                  <td>
                    <span
                      className={`badge ${
                        app.status === 'Interview'
                          ? 'badge-warning'
                          : app.status === 'Shortlisted'
                          ? 'badge-primary'
                          : app.status === 'Hired'
                          ? 'badge-success'
                          : 'badge-info'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedApplicant(app)}
                    >
                      <Eye size={12} /> Review Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standardized Post New Vacancy Modal */}
      <Modal
        isOpen={showAddJobModal}
        onClose={() => setShowAddJobModal(false)}
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
                  <option value="Fitness & Training">Fitness & Training</option>
                  <option value="Front Desk & Reception">Front Desk & Reception</option>
                  <option value="Operations & Floor">Operations & Floor</option>
                  <option value="Nutrition & Dietetics">Nutrition & Dietetics</option>
                  <option value="Maintenance & Hygiene">Maintenance & Hygiene</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Open Positions / Vacancies</label>
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
              <label className="form-label">Job Overview & Requirements</label>
              <textarea
                rows="3"
                placeholder="Key certifications (ACE, ISSA), shift timings, client handling..."
                className="form-textarea"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddJobModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Publish Opening
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Standardized Applicant Review Dossier Modal */}
      <Modal
        isOpen={!!selectedApplicant}
        onClose={() => setSelectedApplicant(null)}
        title={selectedApplicant ? `Candidate: ${selectedApplicant.name}` : 'Applicant Review'}
        subtitle={selectedApplicant ? `Applying for ${selectedApplicant.role}` : ''}
        icon={User}
        size="md"
        footer={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedApplicant(null)}
            >
              Done
            </button>
          </div>
        }
      >
        {selectedApplicant && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-base)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div><strong>Phone:</strong> {selectedApplicant.phone}</div>
              <div><strong>Experience:</strong> {selectedApplicant.exp}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Stage:</strong> <span className="badge badge-primary">{selectedApplicant.status}</span></div>
            </div>

            <div className="form-group">
              <label className="form-label">Recruiter Evaluation Notes</label>
              <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-base)', fontSize: '13px', lineHeight: 1.5 }}>
                {selectedApplicant.notes}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Move Recruitment Stage</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['Screened', 'Interview', 'Shortlisted', 'Hired', 'Rejected'].map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className={`btn btn-sm ${selectedApplicant.status === stage ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleUpdateApplicantStatus(selectedApplicant.id, stage)}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
