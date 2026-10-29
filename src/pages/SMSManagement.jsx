import { useState, useMemo } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Phone,
  Settings,
  Users,
  CheckSquare,
  Square,
  Clock,
  Check,
  CheckCheck,
  Eye,
  Filter,
  X,
  FileText,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import { members as fallbackMembers } from '../data/gymData';
import Avatar from '../components/common/Avatar';
import Modal from '../components/common/Modal';

const MESSAGE_TEMPLATES = [
  {
    id: 'expiry_reminder',
    name: 'Membership Expiry Reminder',
    category: 'Reminder',
    text: 'Hello {{member_name}},\n\nThis is a friendly reminder from {{gym_name}} that your {{plan_name}} membership expires on {{expiry_date}}.\n\nRenew today to maintain seamless access to gym facilities and trainers! Visit reception or reply to this message.',
  },
  {
    id: 'payment_reminder',
    name: 'Outstanding Payment Notice',
    category: 'Billing',
    text: 'Dear {{member_name}},\n\nWe would like to remind you that your pending installment of ৳{{due_amount}} for invoice #{{invoice_no}} is due by {{due_date}}.\n\nPlease clear the balance via bKash, Nagad, or reception cash counter to avoid access interruption. Thank you!\n— {{gym_name}} Accounts Team',
  },
  {
    id: 'bootcamp_announcement',
    name: 'Weekend Bootcamp Announcement',
    category: 'Announcement',
    text: '🔥 Attention {{gym_name}} Athletes!\n\nJoin our exclusive Weekend HIIT & Strength Bootcamp this Friday at 7:00 AM! Free for all active members. High-energy coaching, nutrition samples & agility challenges.\n\nSpots are limited. Reply "JOIN" to reserve your spot!',
  },
  {
    id: 'special_offer',
    name: 'Personal Training 20% Discount Offer',
    category: 'Promotion',
    text: 'Special Offer for {{member_name}}! 🏋️\n\nUpgrade your progress this month with 1-on-1 Certified Personal Training. Enjoy 20% OFF on all 3-month personal training packages if booked before {{valid_until}}.\n\nAsk at the front desk for coach availability!',
  },
  {
    id: 'holiday_notice',
    name: 'Holiday Schedule & Maintenance Notice',
    category: 'Notice',
    text: 'Important Notice for all members of {{gym_name}}:\n\nPlease note that our facility will operate on holiday schedule from 8:00 AM – 4:00 PM tomorrow for deep sterilization and equipment maintenance.\n\nRegular 24/7 hours resume the next morning. Stay safe and fit!',
  },
];

const INITIAL_MESSAGE_HISTORY = [
  {
    id: 'msg-101',
    recipientsCount: 14,
    recipientLabel: '14 Active Members',
    recipientSample: 'Rahim Ahmed, Tanvir Hasan, & 12 others',
    category: 'Announcement',
    message: '🔥 Weekend HIIT & Strength Bootcamp this Friday at 7:00 AM! Free for all active members. Reply JOIN to reserve.',
    timestamp: '2026-10-23 04:30 PM',
    status: 'Delivered',
  },
  {
    id: 'msg-102',
    recipientsCount: 1,
    recipientLabel: 'Farhan Ahmed (FLM-1008)',
    recipientSample: '+880 1711-223344',
    category: 'Billing',
    message: 'Dear Farhan Ahmed, reminder that your pending installment of ৳2,000 is due on 25 Oct 2026. Please settle via bKash or front desk.',
    timestamp: '2026-10-22 11:15 AM',
    status: 'Read',
  },
  {
    id: 'msg-103',
    recipientsCount: 6,
    recipientLabel: '6 Expiring Members',
    recipientSample: 'Nusrat Jahan, Mahin Islam, & 4 others',
    category: 'Reminder',
    message: 'Hello, your FITLIFE membership expires within 3 days. Renew now to enjoy uninterrupted gym access.',
    timestamp: '2026-10-21 09:00 AM',
    status: 'Delivered',
  },
  {
    id: 'msg-104',
    recipientsCount: 1,
    recipientLabel: 'Samiul Karim (FLM-1004)',
    recipientSample: '+880 1819-334455',
    category: 'Promotion',
    message: 'Hi Samiul, celebrate your 6-month gym streak with 20% off all Coffee Shop drinks and protein shakes this weekend!',
    timestamp: '2026-10-19 02:45 PM',
    status: 'Delivered',
  },
];

export default function SMSManagement() {
  const { members: liveMembers, branding } = useGymData();
  const allMembers = liveMembers && liveMembers.length > 0 ? liveMembers : fallbackMembers;
  const gymName = branding?.gymName || 'FITLIFE GYM';

  // WhatsApp Connection UI State
  const [isConnected, setIsConnected] = useState(false);
  const [businessPhone, setBusinessPhone] = useState('+880 1712-345678');
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);
  const [connectionFeedback, setConnectionFeedback] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Recipient Selection State
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());

  // Composition State
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [messageBody, setMessageBody] = useState(
    'Hello {{member_name}},\n\nWelcome to {{gym_name}}! We are delighted to support your fitness journey. For any questions, please speak to your coach or front desk.'
  );

  // Send & Confirmation Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [notification, setNotification] = useState(null);

  // History State
  const [history, setHistory] = useState(INITIAL_MESSAGE_HISTORY);
  const [viewHistoryItem, setViewHistoryItem] = useState(null);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return allMembers.filter((m) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        m.name?.toLowerCase().includes(q) ||
        m.code?.toLowerCase().includes(q) ||
        m.phone?.includes(q);
      const matchesStatus =
        statusFilter === 'All' || m.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [allMembers, searchTerm, statusFilter]);

  // Selection helpers
  const handleToggleMember = (id) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedMemberIds);
    filteredMembers.forEach((m) => next.add(m.id));
    setSelectedMemberIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedMemberIds(new Set());
  };

  // Template selection
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const tmpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setMessageBody(tmpl.text);
    }
  };

  const insertVariable = (varName) => {
    setMessageBody((prev) => `${prev} {{${varName}}}`);
  };

  // Resolve preview of template with first selected member or fallback
  const previewResolvedMessage = useMemo(() => {
    const sampleMember = allMembers.find((m) => selectedMemberIds.has(m.id)) || allMembers[0] || {
      name: 'Rahim Ahmed',
      plan: '12-Month Pro',
      expiryDate: '2026-11-30',
    };

    return messageBody
      .replace(/{{member_name}}/g, sampleMember.name || 'Member')
      .replace(/{{gym_name}}/g, gymName)
      .replace(/{{plan_name}}/g, sampleMember.plan || 'Annual Membership')
      .replace(/{{expiry_date}}/g, sampleMember.expiryDate || '2026-11-30')
      .replace(/{{due_amount}}/g, '2,000')
      .replace(/{{due_date}}/g, '25 Oct 2026')
      .replace(/{{invoice_no}}/g, 'INV-2026-089')
      .replace(/{{valid_until}}/g, 'end of this month');
  }, [messageBody, selectedMemberIds, allMembers, gymName]);

  // Connection toggle
  const handleToggleConnection = () => {
    if (!isConnected) {
      if (!businessPhone.trim()) {
        setConnectionFeedback('Please provide a valid WhatsApp Business phone number.');
        return;
      }
      setIsConnected(true);
      setConnectionFeedback('Connected to WhatsApp Business API (Simulated Frontend Sandbox).');
      setTimeout(() => {
        setIsConnectionModalOpen(false);
        setConnectionFeedback('');
      }, 1200);
    } else {
      setIsConnected(false);
      setConnectionFeedback('WhatsApp Business API connection paused.');
      setTimeout(() => {
        setIsConnectionModalOpen(false);
        setConnectionFeedback('');
      }, 1200);
    }
  };

  // Simulated Send Action
  const handleConfirmSend = () => {
    setIsConfirmModalOpen(false);
    setIsSending(true);
    setSendProgress(20);

    const step1 = setTimeout(() => setSendProgress(60), 600);
    const step2 = setTimeout(() => {
      setSendProgress(100);
      setIsSending(false);

      const recipientCount = selectedMemberIds.size;
      const sampleNames = allMembers
        .filter((m) => selectedMemberIds.has(m.id))
        .map((m) => m.name)
        .slice(0, 2)
        .join(', ');

      const newHistoryEntry = {
        id: `msg-${Date.now()}`,
        recipientsCount: recipientCount,
        recipientLabel: recipientCount === 1 ? sampleNames : `${recipientCount} Members (Broadcast)`,
        recipientSample: recipientCount > 2 ? `${sampleNames}, & ${recipientCount - 2} others` : sampleNames,
        category: MESSAGE_TEMPLATES.find((t) => t.id === selectedTemplateId)?.category || 'General Notice',
        message: previewResolvedMessage,
        timestamp: 'Just now',
        status: 'Delivered',
      };

      setHistory((prev) => [newHistoryEntry, ...prev]);
      setNotification({
        type: 'success',
        text: `Simulated broadcast dispatched successfully! ${recipientCount} WhatsApp ${recipientCount === 1 ? 'message' : 'messages'} queued for delivery.`,
      });
      setTimeout(() => setNotification(null), 6000);
    }, 1400);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
    };
  };

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isConnected ? 'var(--success)' : 'var(--warning)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isConnected ? 'var(--success)' : 'var(--warning)',
                }}
              />
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>
          <h1 className="page-title">WhatsApp Messaging & Campaigns</h1>
          <p className="page-subtitle">
            Compose and broadcast automated notices, payment alerts, and member campaigns.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsConnectionModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Settings size={15} />
            {isConnected ? 'WhatsApp Settings (Connected)' : 'Connect WhatsApp'}
          </button>
        </div>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div
          role="status"
          style={{
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: notification.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sending Progress Bar Banner */}
      {isSending && (
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--bg-card)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className="spin-animation" />
              Simulating Broadcast Dispatch to {selectedMemberIds.size} Recipients...
            </span>
            <span style={{ fontWeight: 700 }}>{sendProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--border-base)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${sendProgress}%`, background: 'var(--primary)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {/* Main Workspace Split Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 1fr) minmax(420px, 1.25fr)',
          gap: '20px',
          alignItems: 'start',
          marginBottom: '24px',
        }}
      >
        {/* LEFT COLUMN: Searchable Member Selector */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-base)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header & Counters */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-base)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Recipients</h3>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: selectedMemberIds.size > 0 ? 'rgba(200, 255, 0, 0.15)' : 'var(--bg-input)',
                  color: selectedMemberIds.size > 0 ? 'var(--primary)' : 'var(--text-muted)',
                  border: '1px solid var(--border-base)',
                }}
              >
                {selectedMemberIds.size} selected of {allMembers.length}
              </span>
            </div>

            {/* Search Input */}
            <div className="header-search" style={{ width: '100%' }}>
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search member by name, code, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '13px' }}
              />
            </div>

            {/* Quick Filter Buttons & Select All / Deselect All */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['All', 'Active', 'Expiring', 'Expired'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setStatusFilter(st)}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSelectAllFiltered}
                  style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Select all currently visible members"
                >
                  <CheckSquare size={13} /> Select All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleDeselectAll}
                  style={{ fontSize: '11px', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Deselect all members"
                >
                  <Square size={13} /> Clear
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Members List */}
          <div style={{ maxHeight: '460px', overflowY: 'auto', padding: '8px' }}>
            {filteredMembers.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No members found matching your search.
              </div>
            ) : (
              filteredMembers.map((member) => {
                const isSelected = selectedMemberIds.has(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => handleToggleMember(member.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(200, 255, 0, 0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(200, 255, 0, 0.25)' : '1px solid transparent',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      transition: 'var(--transition-smooth)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by row click
                        style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                      <Avatar name={member.name} photo={member.avatar || member.photo} size={32} />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {member.code || `ID #${member.id}`} • {member.phone || 'No phone'}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        member.status === 'Active'
                          ? 'badge-success'
                          : member.status === 'Expiring'
                          ? 'badge-warning'
                          : 'badge-secondary'
                      }`}
                      style={{ fontSize: '10px', padding: '2px 6px' }}
                    >
                      {member.status || 'Active'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Message Composer & Live Preview */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Composer Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-base)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Template Selector Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Message Template:
              </label>
              <select
                className="form-select"
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                style={{ width: '100%', fontSize: '13px' }}
              >
                <option value="">Custom Message (No Template)</option>
                {MESSAGE_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    [{tmpl.category}] {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Insertion Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Insert Dynamic Variable:</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => insertVariable('member_name')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                + Member Name
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => insertVariable('plan_name')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                + Plan
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => insertVariable('expiry_date')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                + Expiry Date
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => insertVariable('due_amount')}
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                + Due Amount
              </button>
            </div>

            {/* Message Body Textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Message Content:
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {messageBody.length} characters • ~{Math.ceil(messageBody.length / 160) || 1} WhatsApp segment(s)
                </span>
              </div>
              <textarea
                className="form-input"
                rows={6}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder="Type your WhatsApp broadcast message here..."
                style={{
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Send Broadcast Action Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-base)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Recipients Selected:{' '}
                <strong style={{ color: selectedMemberIds.size > 0 ? 'var(--primary)' : 'var(--danger)' }}>
                  {selectedMemberIds.size} {selectedMemberIds.size === 1 ? 'member' : 'members'}
                </strong>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={selectedMemberIds.size === 0 || !messageBody.trim() || isSending}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700 }}
              >
                <Send size={16} />
                Send WhatsApp Message ({selectedMemberIds.size})
              </button>
            </div>
          </div>

          {/* Interactive WhatsApp Chat Bubble Mockup */}
          <div
            style={{
              background: '#0B141A',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #202C33',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#25D366',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageCircle size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#E9EDEF' }}>
                    {gymName} (Official Account)
                  </div>
                  <div style={{ fontSize: '10px', color: '#8696A0' }}>Live Message Preview</div>
                </div>
              </div>
              <span style={{ fontSize: '10px', color: '#25D366', fontWeight: 700 }}>PREVIEW</span>
            </div>

            {/* Bubble */}
            <div
              style={{
                alignSelf: 'flex-end',
                maxWidth: '90%',
                background: '#005C4B',
                borderRadius: '10px 0px 10px 10px',
                padding: '10px 12px',
                color: '#E9EDEF',
                fontSize: '12.5px',
                lineHeight: 1.5,
                whiteSpace: 'pre-line',
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                position: 'relative',
              }}
            >
              {previewResolvedMessage}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  marginTop: '4px',
                  fontSize: '10px',
                  color: '#8696A0',
                }}
              >
                <span>10:42 AM</span>
                <CheckCheck size={14} style={{ color: '#53BDEB' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGE HISTORY SECTION */}
      <div className="activity-card">
        <div className="activity-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '15px' }}>WhatsApp Campaign & Message History</span>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                Past broadcast dispatches, recipient tallies, and simulated delivery statuses
              </p>
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {history.length} records
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>SL</th>
                <th>Recipient(s)</th>
                <th>Category</th>
                <th>Message Preview</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 700 }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                        {item.recipientLabel}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.recipientSample}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                      {item.category}
                    </span>
                  </td>
                  <td style={{ maxWidth: '340px' }}>
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                      title={item.message}
                    >
                      {item.message}
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{item.timestamp}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background:
                          item.status === 'Read'
                            ? 'rgba(6, 182, 212, 0.15)'
                            : item.status === 'Delivered'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        color:
                          item.status === 'Read'
                            ? 'var(--info)'
                            : item.status === 'Delivered'
                            ? 'var(--success)'
                            : 'var(--danger)',
                      }}
                    >
                      {item.status === 'Read' && <CheckCheck size={13} />}
                      {item.status === 'Delivered' && <CheckCheck size={13} />}
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewHistoryItem(item)}
                      style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHATSAPP CONNECTION MODAL */}
      <Modal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        title="WhatsApp Business API Connection"
        subtitle="Manage cloud gateway settings, sender identity, and frontend simulation state"
        icon={MessageCircle}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsConnectionModalOpen(false)}
            >
              Close
            </button>
            <button
              type="button"
              className={`btn ${isConnected ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggleConnection}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Phone size={15} />
              {isConnected ? 'Disconnect WhatsApp' : 'Connect WhatsApp'}
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Connection Status Badge */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: isConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MessageCircle size={22} style={{ color: isConnected ? 'var(--success)' : 'var(--warning)' }} />
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  Current Status: {isConnected ? 'Connected & Active' : 'Not Connected'}
                </strong>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {isConnected
                    ? 'Meta Cloud API sandbox linked. Broadcasts will simulate real delivery.'
                    : 'Gateway disconnected. Connect to enable campaign broadcasts.'}
                </p>
              </div>
            </div>
            <span
              className={`badge ${isConnected ? 'badge-success' : 'badge-warning'}`}
              style={{ fontSize: '11px' }}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {/* Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                WhatsApp Business Phone Number
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+880 1712-345678"
                />
              </div>
            </label>

            <label className="form-group">
              <span className="form-label" style={{ fontWeight: 700, fontSize: '12px' }}>
                Verified Business Display Name
              </span>
              <input
                type="text"
                className="form-input"
                value={`${gymName} Official`}
                disabled
                style={{ opacity: 0.8 }}
              />
            </label>
          </div>

          {connectionFeedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                color: 'var(--primary)',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {connectionFeedback}
            </div>
          )}

          {/* Backend / Hardware Future Integration Disclaimer */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              <Info size={14} style={{ color: 'var(--primary)' }} />
              Developer & Configuration Notice
            </div>
            <span>
              This is a frontend demonstration interface. In production, your backend developer will wire the real Meta WhatsApp Business Cloud API access token, webhook credentials, and WhatsApp template IDs in server environment secrets.
            </span>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION BEFORE SENDING MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm WhatsApp Broadcast"
        subtitle={`You are about to simulate sending to ${selectedMemberIds.size} recipient(s)`}
        icon={Send}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmSend}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={15} />
              Confirm & Dispatch ({selectedMemberIds.size})
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Info size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong>Simulated Broadcast:</strong> This will dispatch messages in the local frontend state and log records to your campaign history table.
            </span>
          </div>

          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              border: '1px solid var(--border-base)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Audience:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedMemberIds.size} Members</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Channel:</span>
              <strong style={{ color: 'var(--success)' }}>WhatsApp Business Cloud API</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Estimated Cost:</span>
              <strong style={{ color: 'var(--text-primary)' }}>৳0.00 (Demo Sandbox)</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Message Sample Preview:
            </span>
            <div
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-base)',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                whiteSpace: 'pre-line',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {previewResolvedMessage}
            </div>
          </div>
        </div>
      </Modal>

      {/* VIEW MESSAGE HISTORY ITEM DETAILS MODAL */}
      <Modal
        isOpen={!!viewHistoryItem}
        onClose={() => setViewHistoryItem(null)}
        title="Broadcast Message Details"
        subtitle={viewHistoryItem ? `${viewHistoryItem.category} • Sent ${viewHistoryItem.timestamp}` : ''}
        icon={FileText}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setViewHistoryItem(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {viewHistoryItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Recipients:</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {viewHistoryItem.recipientLabel}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
              <span className="badge badge-success" style={{ fontSize: '11px' }}>
                {viewHistoryItem.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Full Message Text:
              </span>
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-base)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                }}
              >
                {viewHistoryItem.message}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
