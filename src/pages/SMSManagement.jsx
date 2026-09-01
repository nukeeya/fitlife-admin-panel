import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Plus,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function SMSManagement() {
  const { smsCampaigns, smsBalance, sendSMS, members } = useGymData();

  const [campaignTitle, setCampaignTitle] = useState('');
  const [recipientType, setRecipientType] = useState('All Members');
  const [messageText, setMessageText] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const templates = [
    {
      label: 'Renewal Expiry Alert',
      text: 'Dear Member, your FitLife Gym membership expires soon. Renew today to keep your preferred locker and enjoy continuous access!',
    },
    {
      label: 'Seasonal Discount Promo',
      text: 'FitLife Special Offer! Renew for 3 months and get a 15% flat discount. Use code MONSOON15 at reception this week!',
    },
    {
      label: 'Welcome New Member',
      text: 'Welcome to FitLife Enterprise Gym! Your fitness journey begins today. Book your free complimentary trainer session at the desk.',
    },
  ];

  const estimatedRecipients =
    recipientType === 'All Members'
      ? members.length
      : recipientType === 'Active Only'
      ? members.filter((m) => m.status === 'Active').length
      : 12;

  const handleSendCampaign = (e) => {
    e.preventDefault();
    if (!campaignTitle || !messageText) {
      alert('Please fill in title and message.');
      return;
    }

    const success = sendSMS({
      title: campaignTitle,
      recipientType,
      message: messageText,
    });

    if (success) {
      setIsSuccess(true);
      setCampaignTitle('');
      setMessageText('');
      setTimeout(() => setIsSuccess(false), 3000);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">SMS Management & Notification Gateway</h1>
          <p className="page-subtitle">
            Broadcast promotional campaigns, automated membership expiry alerts, and transactional messages.
          </p>
        </div>

        <div className="badge-sms" style={{ fontSize: '14px', padding: '8px 16px' }}>
          <MessageSquare size={16} />
          <span>Remaining Credits: {smsBalance.toLocaleString()} SMS</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Campaign Composer */}
        <div className="activity-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="var(--primary)" />
            Compose SMS Campaign
          </h2>

          {isSuccess && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#10B981', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              Campaign dispatched successfully! SMS balance deducted.
            </div>
          )}

          <form onSubmit={handleSendCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Campaign Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. September Weekend Workout Blast"
                className="form-input"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Recipient Group</label>
              <select
                className="form-select"
                value={recipientType}
                onChange={(e) => setRecipientType(e.target.value)}
              >
                <option value="All Members">All Registered Members ({members.length})</option>
                <option value="Active Only">Active Members Only ({members.filter((m) => m.status === 'Active').length})</option>
                <option value="Expiring Members">Expiring in 7 Days (32)</option>
              </select>
            </div>

            {/* Template Selector */}
            <div className="form-group">
              <label className="form-label">Quick Templates</label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {templates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setMessageText(t.text)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">SMS Message Body *</label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {messageText.length} / 160 characters (1 SMS)
                </span>
              </div>
              <textarea
                rows="4"
                required
                placeholder="Type your SMS message here..."
                className="form-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span>Estimated Cost: <strong>{estimatedRecipients} Credits</strong></span>
              <span>Gateway: <strong>Greenweb High-Speed SMS API</strong></span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
              <Send size={16} />
              Broadcast Campaign Now
            </button>
          </form>
        </div>

        {/* Campaign History */}
        <div className="activity-card">
          <div className="activity-header">
            <span style={{ fontWeight: 800 }}>Recent Campaigns & Delivery Logs</span>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {smsCampaigns.map((camp) => (
              <div
                key={camp.id}
                style={{
                  background: 'var(--bg-surface)',
                  padding: '14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-base)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px' }}>{camp.title}</span>
                  <span className={`badge ${camp.status === 'Sent' ? 'badge-success' : 'badge-warning'}`}>
                    {camp.status}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>"{camp.message}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>To: {camp.recipientType} ({camp.count} recipients)</span>
                  <span>{camp.sentAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
