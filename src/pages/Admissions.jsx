import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Loader2, User, Heart, MapPin, Dumbbell, Eye, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Admissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  async function fetchSubmissions() {
    const { data, error } = await supabase
      .from('admission_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data.map(s => ({
        ...s,
        name: `${s.first_name} ${s.last_name}`,
        avatar: `${s.first_name?.[0]}${s.last_name?.[0]}`,
        submittedDate: new Date(s.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      })));
    }
    setLoading(false);
  }

  async function handleApprove(sub) {
    setProcessing(sub.id);
    try {
      // Calculate expiry date (30 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Create member record
      const { error: memberError } = await supabase.from('members').insert({
        submission_id: sub.id,
        first_name: sub.first_name,
        last_name: sub.last_name,
        email: sub.email,
        phone: sub.phone,
        plan: sub.plan === 'basic' ? 'Basic' : sub.plan === 'standard' ? 'Standard' : 'Premium',
        branch: sub.branch,
        joined: new Date().toISOString().split('T')[0],
        expiry: expiryDate.toISOString().split('T')[0],
        status: 'Active',
        visits: 0,
        blood_group: sub.blood_group,
        height: sub.height,
        weight: sub.weight,
        emergency_name: sub.emergency_name,
        emergency_phone: sub.emergency_phone,
      });

      if (memberError) throw memberError;

      // Update submission status
      await supabase
        .from('admission_submissions')
        .update({ status: 'Approved', reviewed_at: new Date().toISOString() })
        .eq('id', sub.id);

      // Refresh list
      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Failed to approve. Please try again.');
    }
    setProcessing(null);
  }

  async function handleReject(sub) {
    setProcessing(sub.id);
    try {
      await supabase
        .from('admission_submissions')
        .update({ status: 'Rejected', reviewed_at: new Date().toISOString() })
        .eq('id', sub.id);

      await fetchSubmissions();
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Rejection failed:', err);
      alert('Failed to reject. Please try again.');
    }
    setProcessing(null);
  }

  const filtered = submissions.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const pendingCount = submissions.filter(s => s.status === 'Pending').length;

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
          <h1 className="page-title">ADMISSIONS</h1>
          <p className="page-subtitle">
            <span className="highlight-number">{pendingCount}</span> PENDING SUBMISSIONS
          </p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-title">TOTAL SUBMISSIONS</span>
          <div className="stat-value">{submissions.length}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">PENDING</span>
          <div className="stat-value" style={{ color: '#FFA500' }}>{submissions.filter(s => s.status === 'Pending').length}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">APPROVED</span>
          <div className="stat-value" style={{ color: 'var(--lime)' }}>{submissions.filter(s => s.status === 'Approved').length}</div>
        </div>
        <div className="stat-card">
          <span className="stat-title">REJECTED</span>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{submissions.filter(s => s.status === 'Rejected').length}</div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="table-card">
        <div className="table-header">
          <h2 className="chart-title">ALL SUBMISSIONS</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>APPLICANT</th>
              <th>PHONE</th>
              <th>BRANCH</th>
              <th>PLAN</th>
              <th>SUBMITTED</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar">{s.avatar}</div>
                    {s.name}
                  </div>
                </td>
                <td>{s.phone}</td>
                <td>{s.branch?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td>{s.plan?.replace(/\b\w/g, l => l.toUpperCase())}</td>
                <td>{s.submittedDate}</td>
                <td>
                  <span className={`status-badge ${
                    s.status === 'Pending' ? 'expiring' :
                    s.status === 'Approved' ? 'active' : 'expired'
                  }`}>
                    ● {s.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn-icon"
                      onClick={() => setSelectedSubmission(s)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {s.status === 'Pending' && (
                      <>
                        <button
                          className="btn-icon"
                          onClick={() => handleApprove(s)}
                          disabled={processing === s.id}
                          title="Approve"
                          style={{ color: 'var(--lime)' }}
                        >
                          {processing === s.id ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleReject(s)}
                          disabled={processing === s.id}
                          title="Reject"
                          style={{ color: 'var(--red)' }}
                        >
                          {processing === s.id ? <Loader2 size={16} className="spin" /> : <XCircle size={16} />}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray)' }}>No submissions found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>APPLICATION DETAILS</h2>
              <button className="modal-close" onClick={() => setSelectedSubmission(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Personal Info */}
              <div className="detail-section">
                <h3><User size={16} /> PERSONAL INFORMATION</h3>
                <div className="detail-grid">
                  <div><span className="detail-label">Name</span><span className="detail-value">{selectedSubmission.name}</span></div>
                  <div><span className="detail-label">Email</span><span className="detail-value">{selectedSubmission.email || '—'}</span></div>
                  <div><span className="detail-label">Phone</span><span className="detail-value">{selectedSubmission.phone}</span></div>
                  <div><span className="detail-label">Date of Birth</span><span className="detail-value">{selectedSubmission.date_of_birth || '—'}</span></div>
                  <div><span className="detail-label">Gender</span><span className="detail-value">{selectedSubmission.gender || '—'}</span></div>
                  <div><span className="detail-label">Address</span><span className="detail-value">{selectedSubmission.address || '—'}</span></div>
                </div>
              </div>

              {/* Branch & Plan */}
              <div className="detail-section">
                <h3><MapPin size={16} /> BRANCH & PLAN</h3>
                <div className="detail-grid">
                  <div><span className="detail-label">Branch</span><span className="detail-value">{selectedSubmission.branch?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></div>
                  <div><span className="detail-label">Plan</span><span className="detail-value">{selectedSubmission.plan?.replace(/\b\w/g, l => l.toUpperCase())}</span></div>
                </div>
              </div>

              {/* Health */}
              <div className="detail-section">
                <h3><Heart size={16} /> HEALTH INFORMATION</h3>
                <div className="detail-grid">
                  <div><span className="detail-label">Blood Group</span><span className="detail-value">{selectedSubmission.blood_group || '—'}</span></div>
                  <div><span className="detail-label">Height</span><span className="detail-value">{selectedSubmission.height ? `${selectedSubmission.height} cm` : '—'}</span></div>
                  <div><span className="detail-label">Weight</span><span className="detail-value">{selectedSubmission.weight ? `${selectedSubmission.weight} kg` : '—'}</span></div>
                  <div><span className="detail-label">Allergies</span><span className="detail-value">{selectedSubmission.allergies || '—'}</span></div>
                  <div className="full-width"><span className="detail-label">Medical Conditions</span><span className="detail-value">{selectedSubmission.medical_conditions || '—'}</span></div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="detail-section">
                <h3>EMERGENCY CONTACT</h3>
                <div className="detail-grid">
                  <div><span className="detail-label">Name</span><span className="detail-value">{selectedSubmission.emergency_name}</span></div>
                  <div><span className="detail-label">Relationship</span><span className="detail-value">{selectedSubmission.emergency_relation || '—'}</span></div>
                  <div><span className="detail-label">Phone</span><span className="detail-value">{selectedSubmission.emergency_phone}</span></div>
                </div>
              </div>
            </div>

            {selectedSubmission.status === 'Pending' && (
              <div className="modal-footer">
                <button
                  className="btn-reject"
                  onClick={() => handleReject(selectedSubmission)}
                  disabled={processing === selectedSubmission.id}
                >
                  {processing === selectedSubmission.id ? <Loader2 size={16} className="spin" /> : <XCircle size={16} />}
                  REJECT
                </button>
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedSubmission)}
                  disabled={processing === selectedSubmission.id}
                >
                  {processing === selectedSubmission.id ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                  APPROVE & CREATE MEMBER
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
