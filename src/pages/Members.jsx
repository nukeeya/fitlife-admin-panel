import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  KeyRound,
  Unlock,
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
import { members as fallbackMembers } from '../data/gymData';
import Modal from '../components/common/Modal';

export default function Members() {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const openAdmission = outletContext?.openAdmission || (() => {});
  const {
    members: liveMembers,
    plans,
    lockers,
    dietPlans,
    workoutPlans,
    assignLocker,
    releaseLocker,
    assignDietPlan,
    assignWorkoutPlan,
  } = useGymData();
  const { resetPassword } = useAuth();
  const allMembers = liveMembers || fallbackMembers;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const [lockerMember, setLockerMember] = useState(null);
  const [selectedLockerId, setSelectedLockerId] = useState('');
  const [planAssignment, setPlanAssignment] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [messageMember, setMessageMember] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isSavingAction, setIsSavingAction] = useState(false);

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

  const availableLockers = lockers.filter((locker) => !locker.isMock && (locker.status === 'Available' || locker.id === lockerMember?.lockerId));
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

    if (action === 'assign') {
      setLockerMember(member);
      setSelectedLockerId(member.lockerId ? String(member.lockerId) : (availableLockers[0]?.id ? String(availableLockers[0].id) : ''));
      return;
    }

    if (action === 'release') {
      const lockerToRelease = lockers.find((locker) => locker.id === member.lockerId || (member.lockerNumber && locker.number === member.lockerNumber));
      if (!lockerToRelease) {
        alert('No locker is currently assigned to this member.');
        return;
      }
      releaseLocker(lockerToRelease.id);
      return;
    }

    if (action === 'diet' || action === 'workout') {
      setPlanAssignment({ member, type: action });
      setSelectedPlanId('');
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

  const disabledIntegrationTitle = 'Requires an access-control/face-ID system integration.';

  const confirmLockerAssignment = async () => {
    if (!lockerMember || !selectedLockerId) {
      alert('Please select a valid locker.');
      return;
    }

    await assignLocker({
      lockerId: Number(selectedLockerId),
      memberId: lockerMember.id,
    });
    setLockerMember(null);
    setSelectedLockerId('');
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Member Management</h1>
          <p className="page-subtitle">
            Comprehensive member registry, dynamic discount audit trail, trainers & locker assignments.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={openAdmission}>
            <Plus size={16} />
            Add New Member
          </button>
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
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="clickable-row"
                onClick={() => navigate(`/members/${m.id}`)}
              >
                <td>
                  <div className="member-cell">
                    <div className="avatar" style={{ overflow: 'hidden' }}>
                      {m.avatar?.startsWith('http') ? (
                        <img src={m.avatar} alt={`${m.name} profile`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : m.avatar}
                    </div>
                    {m.name}
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
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'assign')}
                        >
                          <KeyRound size={14} /> Assign Locker
                        </button>
                        <button
                          type="button"
                          className="member-options-item"
                          role="menuitem"
                          onClick={() => handleMenuAction(m, 'release')}
                        >
                          <Unlock size={14} /> Release Locker
                        </button>
                        <div className="member-options-divider" />
                        <button type="button" className="member-options-item" role="menuitem" disabled title={disabledIntegrationTitle}>
                          <CheckCircle2 size={14} /> Force Access Allow
                        </button>
                        <button type="button" className="member-options-item" role="menuitem" disabled title={disabledIntegrationTitle}>
                          <Ban size={14} /> Force Access Deny
                        </button>
                        <button type="button" className="member-options-item" role="menuitem" disabled title={disabledIntegrationTitle}>
                          <ScanFace size={14} /> Sync with Face ID
                        </button>
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

      {actionFeedback && (
        <div
          role={actionFeedback.type === 'error' ? 'alert' : 'status'}
          className={`member-action-feedback ${actionFeedback.type}`}
        >
          {actionFeedback.text}
        </div>
      )}

      <Modal
        isOpen={!!lockerMember}
        onClose={() => {
          setLockerMember(null);
          setSelectedLockerId('');
        }}
        title="Assign Locker"
        subtitle={lockerMember ? `${lockerMember.name} · ${lockerMember.code}` : ''}
        size="sm"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setLockerMember(null);
                setSelectedLockerId('');
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmLockerAssignment}
            >
              Confirm Assignment
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label className="form-group">
            <span className="form-label">Select locker</span>
            <select
              className="form-select"
              value={selectedLockerId}
              onChange={(event) => setSelectedLockerId(event.target.value)}
            >
              <option value="">No locker</option>
              {availableLockers.map((locker) => (
                <option key={locker.id} value={String(locker.id)}>
                  {locker.number}{locker.zone ? ` · ${locker.zone}` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

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
            <span className="member-action-help">No other saved plans are available. Create a plan in the Diet Plans or AI Workout section first.</span>
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
