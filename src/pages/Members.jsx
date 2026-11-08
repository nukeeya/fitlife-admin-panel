import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Ban,
  ScanFace,
  RotateCcw,
  Salad,
  Dumbbell,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import DataState from '../components/common/DataState';
import Avatar from '../components/common/Avatar';
import { db } from '../lib/supabaseData';

export default function Members() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const openAdmission = outletContext?.openAdmission || (() => {});
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('search') || searchParams.get('q') || '';

  const {
    members: liveMembers,
    plans,
    dietPlans,
    workoutPlans,
    assignDietPlan,
    assignWorkoutPlan,
    refresh,
    loading,
    loadErrors,
  } = useGymData();
  const { resetPassword, access } = useAuth();
  const allMembers = liveMembers || [];

  const [searchTerm, setSearchTerm] = useState(queryFromUrl);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
    }
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [planAssignment, setPlanAssignment] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [messageMember, setMessageMember] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [faceEnrollMember, setFaceEnrollMember] = useState(null);

  useEffect(() => {
    if (openMenuId === null) return undefined;

    const handleDismiss = (event) => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (
        event.type === 'pointerdown'
        && (event.target.closest('.member-options-menu') || event.target.closest('.member-options-trigger'))
      ) return;
      setOpenMenuId(null);
    };
    const handleScroll = (event) => {
      if (event.target.closest?.('.member-options-menu')) return;
      setOpenMenuId(null);
    };

    document.addEventListener('pointerdown', handleDismiss);
    document.addEventListener('keydown', handleDismiss);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('pointerdown', handleDismiss);
      document.removeEventListener('keydown', handleDismiss);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [openMenuId]);

  const filtered = allMembers.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' || m.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesPlan = planFilter === 'All' || m.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const availablePlans = planAssignment
    ? (planAssignment.type === 'diet' ? dietPlans : workoutPlans)
      .filter((plan) => plan.memberId === null || plan.memberId === undefined || Number(plan.memberId) !== planAssignment.member.id)
    : [];

  const handleMenuAction = async (member, action) => {
    setOpenMenuId(null);
    setActionFeedback(null);

    if (action === 'details') {
      navigate(`/members/${member.id}`);
      return;
    }

    if (action === 'diet' || action === 'workout') {
      setPlanAssignment({ member, type: action });
      setSelectedPlanId('');
      return;
    }

    if (action === 'enroll-face') {
      setFaceEnrollMember(member);
      return;
    }

    if (action === 'send-to-machine') {
      const { data: pin, error } = await db.sendMemberToMachine(member.id);
      setActionFeedback(error
        ? { type: 'error', text: `Couldn't send ${member.name} to the machine: ${error.message}` }
        : { type: 'success', text: `${member.name} will appear on the machine as user ${pin} in about a minute. Then open that user on the machine and tap Face.` });
      return;
    }

    if (action === 'message') {
      if (!member.phone) {
        setActionFeedback({ type: 'error', text: `${member.name} does not have a phone number on file.` });
        return;
      }
      setMessageMember(member);
      setMessageText('');
      return;
    }

    if (action === 'password') {
      if (!member.email) {
        setActionFeedback({ type: 'error', text: `${member.name} does not have an email address on file.` });
        return;
      }
      const { error } = await resetPassword(member.email);
      setActionFeedback(error
        ? { type: 'error', text: `Password reset request failed: ${error.message}` }
        : { type: 'success', text: `Password reset request submitted for ${member.email}.` });
    }
  };

  const toggleMemberMenu = (event, member) => {
    event.stopPropagation();
    if (openMenuId === member.id) {
      setOpenMenuId(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const menuWidth = 260;
    const menuHeight = Math.min(440, window.innerHeight - 24);
    const left = Math.max(12, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 12));
    const belowTop = bounds.bottom + 6;
    const top = belowTop + menuHeight <= window.innerHeight - 12
      ? belowTop
      : Math.max(12, bounds.top - menuHeight - 6);

    setOpenMenuId(member.id);
    setMenuPosition({ top, left });
  };

  const confirmPlanAssignment = async () => {
    if (!planAssignment || !selectedPlanId) {
      setActionFeedback({ type: 'error', text: 'Select a plan before assigning it.' });
      return;
    }

    setIsSavingAction(true);
    const assign = planAssignment.type === 'diet' ? assignDietPlan : assignWorkoutPlan;
    let result;
    try {
      result = await assign(Number(selectedPlanId), planAssignment.member.id);
    } catch (error) {
      setIsSavingAction(false);
      setActionFeedback({ type: 'error', text: `Plan assignment failed: ${error.message}` });
      return;
    }
    setIsSavingAction(false);
    if (result?.error) {
      setActionFeedback({ type: 'error', text: `Plan assignment failed: ${result.error.message}` });
      return;
    }

    setPlanAssignment(null);
    setSelectedPlanId('');
    setActionFeedback({ type: 'success', text: 'Plan assigned successfully.' });
  };

  const openMemberMessage = () => {
    const phone = String(messageMember?.phone || '').replace(/[^\d+]/g, '');
    if (!phone || !messageText.trim()) {
      setActionFeedback({ type: 'error', text: 'Enter a message and confirm the member has a valid phone number.' });
      return;
    }

    window.location.href = `sms:${phone}?body=${encodeURIComponent(messageText.trim())}`;
    setMessageMember(null);
    setMessageText('');
  };

  const confirmFaceEnroll = async () => {
    const member = faceEnrollMember;
    setIsSavingAction(true);
    const { data: pin, error } = await db.enrollMemberFace(member.id);
    setIsSavingAction(false);
    setFaceEnrollMember(null);
    setActionFeedback(error
      ? { type: 'error', text: `Couldn't start the face scan for ${member.name}: ${error.message}` }
      : { type: 'success', text: `${member.name} is user ${pin}. The scan will start on the machine within about a minute. Check the Devices tab for "Face saved".` });
  };

  const disabledIntegrationTitle ='Requires an access-control/face-ID system integration.';

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Member Management</h1>
          <p className="page-subtitle">
            Comprehensive member registry, dynamic discount audit trail and trainer assignments.
          </p>
        </div>

        <div className="page-actions">
          {access.admissions && (
            <button className="btn btn-primary" onClick={openAdmission}>
              <Plus size={16} />
              Add New Member
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
        <div className="header-search" style={{ flex: '1 1 240px', maxWidth: 360 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by name, code, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>STATUS:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['All', 'Active', 'Expiring', 'Expired'].map((s) => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>PLAN:</span>
            <select
              className="form-select"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="All">All Packages</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.name}>{plan.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataState
        loading={loading}
        error={loadErrors.members}
        isEmpty={allMembers.length === 0}
        noun="members"
        onRetry={refresh}
        onAdd={access.admissions ? openAdmission : undefined}
        addLabel="Add your first member"
      >
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>MEMBER</th>
              <th>PLAN</th>
              <th>JOINED</th>
              <th>EXPIRY</th>
              <th>STATUS</th>
              <th style={{ width: '90px', textAlign: 'right' }}>OPTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No members match your search or filters.
                </td>
              </tr>
            )}
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="clickable-row"
                onClick={() => navigate(`/members/${m.id}`)}
              >
                <td>
                  <div className="member-cell" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar src={m.avatar} name={m.name} size={36} shape="circle" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {m.code || `FLM-${String(m.id).padStart(4, '0')}`}
                      </span>
                    </div>
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
                <td style={{ textAlign: 'right' }}>
                  <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm member-options-trigger"
                      onClick={(event) => toggleMemberMenu(event, m)}
                      aria-label={`Open options for ${m.name}`}
                      aria-expanded={openMenuId === m.id}
                    >
                      <MoreHorizontal size={14} />
                    </button>

                    {openMenuId === m.id && menuPosition && createPortal(
                      <div
                        className="member-options-menu"
                        role="menu"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'details')}
                        >
                          <Eye size={14} /> View Details
                        </button>
                        <div className="member-options-divider" />
                        <button type="button" className="member-options-item" role="menuitem" disabled title={disabledIntegrationTitle}>
                          <CheckCircle2 size={14} /> Force Access Allow
                        </button>
                        <button type="button" className="member-options-item" role="menuitem" disabled title={disabledIntegrationTitle}>
                          <Ban size={14} /> Force Access Deny
                        </button>
                        {access?.approveMembers && (
                          <button
                            type="button"
                            className="member-options-item"
                            role="menuitem"
                            onClick={() => handleMenuAction(m, 'enroll-face')}
                          >
                            <ScanFace size={14} /> New Face Enroll
                          </button>
                        )}
                        {access?.approveMembers && (
                          <button
                            type="button"
                            className="member-options-item"
                            role="menuitem"
                            onClick={() => handleMenuAction(m, 'send-to-machine')}
                          >
                            <ScanFace size={14} /> Send to Machine
                          </button>
                        )}
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'diet')}
                        >
                          <Salad size={14} /> Assign Diet Plan
                        </button>
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'workout')}
                        >
                          <Dumbbell size={14} /> Assign Workout Plan
                        </button>
                        <button type="button" className="member-options-item" role="menuitem" disabled title={disabledIntegrationTitle}>
                          <RotateCcw size={14} /> Reset Access Allow or Deny
                        </button>
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'message')}
                        >
                          <MessageSquare size={14} /> Send Message
                        </button>
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'password')}
                        >
                          <Mail size={14} /> Reset Password Request
                        </button>
                      </div>,
                      document.body
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </DataState>

      <Modal
        isOpen={!!faceEnrollMember}
        onClose={() => { if (!isSavingAction) setFaceEnrollMember(null); }}
        title="New Face Enroll"
        size="sm"
        closeOnBackdropClick={!isSavingAction}
        closeOnEsc={!isSavingAction}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" disabled={isSavingAction} onClick={() => setFaceEnrollMember(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={isSavingAction} onClick={confirmFaceEnroll}>
              {isSavingAction ? 'Starting…' : 'Member agreed. Start scan'}
            </button>
          </div>
        }
      >
        <p style={{ margin: '0 0 10px' }}>
          Ask <strong>{faceEnrollMember?.name}</strong> to stand in front of the door machine.
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
          Confirm they&apos;ve agreed to have their face stored on the machine for door access. If they don&apos;t
          agree, cancel and give them a card instead.
        </p>
      </Modal>

      {actionFeedback && (
        <div
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          className={`member-action-feedback ${actionFeedback.type}`}
        >
          {actionFeedback.text}
        </div>
      )}

      <Modal
        isOpen={!!planAssignment}
        onClose={() => {
          if (isSavingAction) return;
          setPlanAssignment(null);
          setSelectedPlanId('');
        }}
        title={planAssignment?.type === 'diet' ? 'Assign Diet Plan' : 'Assign Workout Plan'}
        subtitle={planAssignment?.member ? `${planAssignment.member.name} · ${planAssignment.member.code}` : ''}
        size="sm"
        closeOnBackdropClick={!isSavingAction}
        closeOnEsc={!isSavingAction}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSavingAction}
              onClick={() => {
                setPlanAssignment(null);
                setSelectedPlanId('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isSavingAction || !selectedPlanId}
              onClick={confirmPlanAssignment}
            >
              {isSavingAction ? 'Assigning…' : 'Assign Plan'}
            </button>
          </div>
        }
      >
        <label className="form-group">
          <span className="form-label">Select plan</span>
          <select
            className="form-select"
            value={selectedPlanId}
            onChange={(event) => setSelectedPlanId(event.target.value)}
            disabled={isSavingAction}
          >
            <option value="">Choose a plan</option>
            {availablePlans.map((plan) => (
              <option key={plan.id} value={String(plan.id)}>
                {[plan.goal, plan.clientName].filter(Boolean).join(' · ') || `Plan ${plan.id}`}
              </option>
            ))}
          </select>
          {availablePlans.length === 0 && (
            <span className="member-action-help">No other saved plans are available. Create a plan in the Make Diet Plan or Make Workout Plan section first.</span>
          )}
        </label>
        {actionFeedback?.type === 'error' && (
          <div role="alert" className="member-action-feedback error">{actionFeedback.text}</div>
        )}
      </Modal>

      <Modal
        isOpen={!!messageMember}
        onClose={() => {
          setMessageMember(null);
          setMessageText('');
        }}
        title="Send Message"
        subtitle={messageMember ? `${messageMember.name} · ${messageMember.phone}` : ''}
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMessageMember(null);
                setMessageText('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!messageText.trim()}
              onClick={openMemberMessage}
            >
              <MessageSquare size={14} /> Open Messages
            </button>
          </div>
        }
      >
        <label className="form-group">
          <span className="form-label">Message</span>
          <textarea
            className="form-input"
            rows={5}
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Write a message for this member..."
          />
        </label>
        <p className="member-action-help">
          This opens your device’s messaging app with the member’s number and your message ready to send.
        </p>
      </Modal>
    </div>
  );
}
