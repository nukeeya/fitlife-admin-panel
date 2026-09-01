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
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function JobPosting() {
  const { jobs } = useGymData();
  const [showAddJobModal, setShowAddJobModal] = useState(false);

  const sampleApplicants = [
    { id: 1, name: 'Shahidul Alam', role: 'Certified Female Fitness Trainer', exp: '3.5 yrs', status: 'Shortlisted', phone: '+880 1711-998877' },
    { id: 2, name: 'Farzana Yesmin', role: 'Front Desk & Guest Relations Executive', exp: '2 yrs', status: 'Interview', phone: '+880 1833-221144' },
    { id: 3, name: 'Dr. Tariqul Islam', role: 'Sports Physiotherapist & Rehab Specialist', exp: '5 yrs', status: 'Screened', phone: '+880 1911-332211' },
    { id: 4, name: 'Mahmudur Rahman', role: 'Front Desk & Guest Relations Executive', exp: '1 yr', status: 'Applied', phone: '+880 1677-445566' },
  ];

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

        <button className="btn btn-primary" onClick={() => alert('New Job Opening Modal')}>
          <Plus size={16} />
          + Post New Vacancy
        </button>
      </div>

      {/* Active Openings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
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
      <div className="activity-card">
        <div className="activity-header">
          <span style={{ fontWeight: 800 }}>Recent Candidate Applications Pipeline</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Active applicant review
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
              {sampleApplicants.map((app) => (
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
                          : 'badge-info'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => alert(`Reviewing resume for ${app.name}`)}>
                      <Eye size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
