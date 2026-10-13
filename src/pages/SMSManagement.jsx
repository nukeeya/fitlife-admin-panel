import { MessageCircle, Send } from 'lucide-react';

export default function SMSManagement() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">WhatsApp Management</h1>
          <p className="page-subtitle">
            Prepare WhatsApp notices, membership updates, and offers for gym members.
          </p>
        </div>
      </div>

      <div className="whatsapp-setup-card">
        <div className="whatsapp-setup-heading">
          <div className="whatsapp-setup-icon"><MessageCircle size={22} /></div>
          <div>
            <h2>WhatsApp Business campaigns</h2>
            <p>Meta WhatsApp Business Cloud API</p>
          </div>
          <span className="whatsapp-status-badge">Sending disabled</span>
        </div>

        <div className="whatsapp-setup-notice" role="status">
          Bulk delivery is intentionally disabled until member consent and approved message templates are ready.
        </div>

        <div className="whatsapp-requirements">
          <h3>Required before sending</h3>
          <ul>
            <li>
              <span className="whatsapp-requirement-pending">Pending</span>
              Record and verify WhatsApp opt-in for members who will receive campaigns.
            </li>
            <li>
              <span className="whatsapp-requirement-pending">Pending</span>
              Use Meta-approved templates for gym-initiated notices and promotional offers.
            </li>
            <li>
              <span className="whatsapp-requirement-server">Server-side</span>
              Connect the Cloud API phone number and access token through a Supabase Edge Function.
            </li>
          </ul>
        </div>

        <p className="whatsapp-security-note">
          Keep the Meta access token and phone number credentials in server-side secrets only. Do not add them to this page, browser storage, or <code>VITE_</code> environment variables.
        </p>

        <button
          type="button"
          className="btn btn-secondary"
          disabled
          title="Complete the requirements above before enabling WhatsApp campaigns."
        >
          <Send size={16} /> WhatsApp Broadcast Unavailable
        </button>
      </div>
    </div>
  );
}
