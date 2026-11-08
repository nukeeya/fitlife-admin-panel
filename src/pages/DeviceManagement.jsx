import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit2, Link2, Plus, Power, RefreshCw, ScanFace, Unlink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/supabaseData';
import Modal from '../components/common/Modal';

const REFRESH_MS = 15000;
const ONLINE_WITHIN_MS = 2 * 60 * 1000; // the machine checks in every 30 seconds

const EMPTY_FORM = { serialNumber: '', name: '', location: '' };

const cardStyle = {
  background: 'var(--bg-card)',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  padding: '20px',
};

const dhakaTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Dhaka',
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
});
const formatTime = (value) => (value ? dhakaTime.format(new Date(value)) : 'Never');

const memberName = (m) => `${m.first_name} ${m.last_name}`.trim();

const VERIFY_LABELS = { 1: 'Fingerprint', 4: 'Card', 15: 'Face' };

// Keep the "Door opened" codes in step with device_event_grants_entry() in migration 022.
function eventLabel(code) {
  if (code === 0 || code === 1 || code === 3) return { text: 'Door opened', color: '#10B981' };
  if (code === 202) return { text: 'Exit button', color: '#3B82F6' };
  if (code === 206) return { text: 'Machine started', color: '#64748B' };
  if (code === 102) return { text: 'Door opened without a scan', color: '#EF4444' };
  return { text: `Event ${code}`, color: '#F59E0B' };
}

function sendStatus(commands) {
  if (commands.some((c) => c.status === 'failed')) return { text: 'Failed. Send again', color: '#EF4444' };
  if (commands.some((c) => c.status === 'expired')) return { text: 'Not delivered. Send again', color: '#EF4444' };
  if (commands.some((c) => c.status !== 'done')) return { text: 'Waiting for machine', color: '#F59E0B' };
  return { text: 'Ready. Add face on machine', color: '#10B981' };
}

function deviceStatus(device, now) {
  if (!device.enabled) return { text: 'Disabled', color: '#64748B' };
  if (!device.last_seen_at) return { text: 'Never connected', color: '#F59E0B' };
  return now - new Date(device.last_seen_at).getTime() < ONLINE_WITHIN_MS
    ? { text: 'Online', color: '#10B981' }
    : { text: 'Offline', color: '#EF4444' };
}

function Pill({ text, color }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        color,
        background: `${color}1F`,
      }}
    >
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />
      {text}
    </span>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, overflowWrap: 'anywhere' }}>{value || '—'}</div>
    </div>
  );
}

export default function DeviceManagement() {
  const { access } = useAuth();
  const canManage = !!access?.superAdmin;

  const [devices, setDevices] = useState([]);
  const [punches, setPunches] = useState([]);
  const [members, setMembers] = useState([]);
  const [machineSends, setMachineSends] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [linkPin, setLinkPin] = useState('');
  const [linkMemberId, setLinkMemberId] = useState('');

  const load = useCallback(async () => {
    const [deviceRes, punchRes, memberRes, sendRes] = await Promise.all([
      db.listDevices(),
      db.listDevicePunches(),
      db.listMemberDeviceLinks(),
      db.listMachineSends(),
    ]);
    const error = deviceRes.error || punchRes.error || memberRes.error || sendRes.error;
    if (error) {
      setLoadError(error.message);
    } else {
      setLoadError(null);
      setDevices(deviceRes.data);
      setPunches(punchRes.data);
      setMembers(memberRes.data);
      setMachineSends(sendRes.data);
      setNow(Date.now());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const linkedMembers = useMemo(() => members.filter((m) => m.device_user_id), [members]);
  const membersByPin = useMemo(() => new Map(linkedMembers.map((m) => [m.device_user_id, m])), [linkedMembers]);
  const devicesById = useMemo(() => new Map(devices.map((d) => [d.id, d])), [devices]);

  // Each member's latest send. Commands queued together share a created_at.
  const latestSends = useMemo(() => {
    const byMember = new Map();
    for (const command of machineSends) {
      const send = byMember.get(command.member_id);
      if (!send) byMember.set(command.member_id, { memberId: command.member_id, createdAt: command.created_at, commands: [command] });
      else if (send.createdAt === command.created_at) send.commands.push(command);
    }
    return [...byMember.values()].slice(0, 10);
  }, [machineSends]);

  const unlinkedPins = useMemo(
    () => [...new Set(punches.map((p) => p.device_user_id))].filter((pin) => pin !== '0' && !membersByPin.has(pin)),
    [punches, membersByPin]
  );

  const showResult = (error, successText) => {
    setFeedback(error ? { ok: false, text: error.message } : { ok: true, text: successText });
    if (!error) load();
  };

  const openAdd = () => {
    setEditingDevice(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEdit = (device) => {
    setEditingDevice(device);
    setForm({ serialNumber: device.serial_number, name: device.name, location: device.location || '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const { error } = editingDevice
      ? await db.updateDevice(editingDevice.id, { name: form.name.trim(), location: form.location.trim() || null })
      : await db.insertDevice({
          serial_number: form.serialNumber.trim(),
          name: form.name.trim(),
          location: form.location.trim() || null,
        });
    setIsSaving(false);
    if (!error) setIsModalOpen(false);
    showResult(
      error?.code === '23505' ? new Error('A device with that serial number already exists.') : error,
      'Device saved.'
    );
  };

  const handleToggle = async (device) => {
    const { error } = await db.updateDevice(device.id, { enabled: !device.enabled });
    showResult(error, device.enabled ? 'Device disabled. Its scans will be refused.' : 'Device enabled.');
  };

  const handleLink = async (e) => {
    e.preventDefault();
    const { error } = await db.setMemberDeviceUser(Number(linkMemberId), linkPin.trim());
    if (!error) {
      setLinkPin('');
      setLinkMemberId('');
    }
    showResult(
      error?.code === '23505' ? new Error('That machine user number is already linked to a member.') : error,
      'Member linked. Their next scan will be counted as attendance.'
    );
  };

  const handleUnlink = async (member) => {
    const { error } = await db.setMemberDeviceUser(member.id, null);
    showResult(error, `${memberName(member)} unlinked.`);
  };

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <h1 className="page-title">Devices</h1>
          <p className="page-subtitle">Door machines and the scans they send</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={load}>
            <RefreshCw size={15} /> Refresh
          </button>
          {canManage && (
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Add Device
            </button>
          )}
        </div>
      </div>

      {(feedback || loadError) && (
        <div
          role="status"
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: !loadError && feedback?.ok ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: !loadError && feedback?.ok ? '#10B981' : '#EF4444',
            fontSize: '13px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {!loadError && feedback?.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{loadError ? `Couldn't load device data: ${loadError}` : feedback.text}</span>
        </div>
      )}

      {isLoading ? (
        <div style={cardStyle}>Loading devices…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {devices.length === 0 && !loadError && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 20px' }}>
              <ScanFace size={36} style={{ color: 'var(--text-muted)' }} />
              <h3 style={{ margin: '12px 0 4px' }}>No devices yet</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Add a machine by its serial number so its scans are accepted.
              </p>
            </div>
          )}

          {devices.map((device) => {
            const status = deviceStatus(device, now);
            return (
              <div key={device.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ScanFace size={22} style={{ color: 'var(--primary)' }} />
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{device.name}</h3>
                    <Pill {...status} />
                  </div>
                  {canManage && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => openEdit(device)}>
                        <Edit2 size={14} /> Edit
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleToggle(device)}>
                        <Power size={14} /> {device.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '14px',
                    marginTop: '16px',
                  }}
                >
                  <Detail label="Last seen" value={formatTime(device.last_seen_at)} />
                  <Detail label="Serial number" value={device.serial_number} />
                  <Detail label="Location" value={device.location} />
                  <Detail label="Model" value={device.model} />
                  <Detail label="Network address" value={device.ip_address} />
                  <Detail label="Firmware" value={device.firmware} />
                </div>
              </div>
            );
          })}

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>Link machine users to members</h3>
            <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Enroll the face or fingerprint on the machine, then link its user number here. Scans made before
              linking aren&apos;t counted as attendance.
            </p>
            <form onSubmit={handleLink} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="link-pin">Machine user number</label>
                <input
                  id="link-pin"
                  className="form-input"
                  inputMode="numeric"
                  pattern="[1-9][0-9]*"
                  required
                  value={linkPin}
                  onChange={(e) => setLinkPin(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ margin: 0, flex: '1 1 220px' }}>
                <label className="form-label" htmlFor="link-member">Member</label>
                <select
                  id="link-member"
                  className="form-select"
                  required
                  value={linkMemberId}
                  onChange={(e) => setLinkMemberId(e.target.value)}
                >
                  <option value="">Choose a member…</option>
                  {members.filter((m) => !m.device_user_id).map((m) => (
                    <option key={m.id} value={m.id}>{memberName(m)} ({m.member_code})</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn btn-primary"><Link2 size={15} /> Link</button>
            </form>

            {unlinkedPins.length > 0 && (
              <div style={{ marginTop: '12px', fontSize: '13px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Recent scans from unlinked users:</span>
                {unlinkedPins.map((pin) => (
                  <button key={pin} type="button" className="btn btn-secondary btn-sm" onClick={() => setLinkPin(pin)}>
                    User {pin}
                  </button>
                ))}
              </div>
            )}

            {linkedMembers.length > 0 && (
              <div className="table-responsive" style={{ marginTop: '14px' }}>
                <table className="custom-table">
                  <thead>
                    <tr><th>Machine user</th><th>Member</th><th>Code</th><th /></tr>
                  </thead>
                  <tbody>
                    {linkedMembers.map((m) => (
                      <tr key={m.id}>
                        <td>{m.device_user_id}</td>
                        <td>{memberName(m)}</td>
                        <td>{m.member_code}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleUnlink(m)}>
                            <Unlink size={14} /> Unlink
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {latestSends.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 4px', fontSize: '15px' }}>Sent to the machine</h3>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                When a member is ready, open their user number on the machine and tap Face.
              </p>
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr><th>Member</th><th>Machine user</th><th>Sent</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {latestSends.map((send) => {
                      const member = membersById.get(send.memberId);
                      return (
                        <tr key={send.memberId}>
                          <td>{member ? memberName(member) : '—'}</td>
                          <td>{member?.device_user_id || '—'}</td>
                          <td>{formatTime(send.createdAt)}</td>
                          <td><Pill {...sendStatus(send.commands)} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 14px', fontSize: '15px' }}>Recent activity</h3>
            {punches.length === 0 ? (
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                No scans received yet.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr><th>Time</th><th>Who</th><th>Method</th><th>Result</th><th>Attendance</th><th>Machine</th></tr>
                  </thead>
                  <tbody>
                    {punches.map((p) => {
                      const member = membersById.get(p.member_id);
                      const who = member
                        ? memberName(member)
                        : p.device_user_id === '0' ? '—' : `Not linked (user ${p.device_user_id})`;
                      return (
                        <tr key={p.id}>
                          <td>{formatTime(p.punched_at)}</td>
                          <td>{who}</td>
                          <td>{p.device_user_id === '0' ? '—' : VERIFY_LABELS[p.verify_type] || `Type ${p.verify_type}`}</td>
                          <td><Pill {...eventLabel(p.event_code)} /></td>
                          <td>{p.attendance_id ? 'Counted' : '—'}</td>
                          <td>{devicesById.get(p.device_id)?.name || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDevice ? 'Edit Device' : 'Add Device'}
        size="sm"
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label" htmlFor="device-serial">Serial number *</label>
            <input
              id="device-serial"
              className="form-input"
              required
              pattern="[A-Za-z0-9_\-]{4,64}"
              disabled={!!editingDevice}
              value={form.serialNumber}
              onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="device-name">Name *</label>
            <input
              id="device-name"
              className="form-input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="device-location">Location</label>
            <input
              id="device-location"
              className="form-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
