import { useState } from 'react';
import { X, UserCheck, CheckCircle2, Search } from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function QuickCheckInModal({ isOpen, onClose }) {
  const { members, attendance, checkInMember, checkOutMember } = useGymData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('RFID Card');

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  const isMemberCheckedIn = (memberId) => {
    return attendance.find(
      (a) => a.memberId === memberId && a.date === '2026-09-01' && a.status === 'In'
    );
  };

  const handleAction = (member) => {
    const record = isMemberCheckedIn(member.id);
    if (record) {
      checkOutMember(record.id);
    } else {
      checkInMember(member.id, selectedMethod);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Quick Daily Member Check-In / Out</h2>
          </div>
          <button className="header-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Method Selector */}
          <div className="form-group">
            <label className="form-label">Check-In Method</label>
            <select
              className="form-select"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="RFID Card">RFID Card Terminal</option>
              <option value="Biometric">Biometric Fingerprint Scanner</option>
              <option value="Barcode">Mobile App QR / Barcode</option>
              <option value="Manual Admin">Manual Reception Desk</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="header-search" style={{ width: '100%' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              autoFocus
              placeholder="Type member name, FLM code or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Member List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {filteredMembers.map((m) => {
              const activeRecord = isMemberCheckedIn(m.id);
              return (
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
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {m.code} • {m.plan}
                      </span>
                    </div>
                  </div>

                  <button
                    className={`btn btn-sm ${activeRecord ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => handleAction(m)}
                  >
                    {activeRecord ? `Check Out (${activeRecord.checkIn})` : 'Check In'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
