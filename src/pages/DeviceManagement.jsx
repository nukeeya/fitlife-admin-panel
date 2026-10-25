import React, { useState } from 'react';
import {
  ScanFace,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Activity,
  Server,
  Wifi,
  WifiOff,
  Info,
} from 'lucide-react';
import Modal from '../components/common/Modal';

// Sample pre-configured entrance device
const INITIAL_DEVICES = [
  {
    id: 'dev_01',
    name: 'Main Entrance Face Recognition Terminal',
    type: 'Face Recognition Access Controller',
    model: 'FR-8000 Pro (Biometric Terminal)',
    location: 'Main Gym Entrance (Turnstile Gate #1)',
    ipAddress: '192.168.1.120',
    port: '8000',
    protocol: 'TCP/IP WebSocket & HTTP REST',
    macAddress: '70:B3:D5:19:8A:2F',
    serialNumber: 'SN-FR2026-99412',
    doorRelayMs: '3000',
    antiPassback: true,
    status: 'connected', // 'connected' | 'disconnected' | 'not_configured'
    lastSeen: '24 Oct 2026, 12:54:18 PM (Just now)',
    latencyMs: 24,
    enrolledFacesCount: 428,
  },
];

export default function DeviceManagement() {
  const [devices, setDevices] = useState(INITIAL_DEVICES);
  const [activeDeviceId, setActiveDeviceId] = useState(INITIAL_DEVICES[0]?.id || null);

  // Setup / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  // Connection simulation state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // Form State for Setup / Edit
  const [formData, setFormData] = useState({
    name: '',
    type: 'Face Recognition Access Controller',
    model: 'FR-8000 Pro (Biometric Terminal)',
    location: 'Main Gym Entrance (Turnstile Gate #1)',
    ipAddress: '192.168.1.120',
    port: '8000',
    protocol: 'TCP/IP WebSocket & HTTP REST',
    serialNumber: '',
    doorRelayMs: '3000',
    antiPassback: true,
  });

  const activeDevice = devices.find((d) => d.id === activeDeviceId) || devices[0] || null;

  // Open Add Device Modal
  const handleOpenAdd = () => {
    setEditingDevice(null);
    setFormData({
      name: 'Main Entrance Face Recognition Terminal',
      type: 'Face Recognition Access Controller',
      model: 'FR-8000 Pro',
      location: 'Main Entrance Turnstile',
      ipAddress: '192.168.1.125',
      port: '8000',
      protocol: 'TCP/IP WebSocket & HTTP REST',
      serialNumber: `SN-FR-${Math.floor(10000 + Math.random() * 90000)}`,
      doorRelayMs: '3000',
      antiPassback: true,
    });
    setIsModalOpen(true);
  };

  // Open Edit Device Modal
  const handleOpenEdit = (dev) => {
    setEditingDevice(dev);
    setFormData({
      name: dev.name,
      type: dev.type,
      model: dev.model,
      location: dev.location,
      ipAddress: dev.ipAddress,
      port: dev.port,
      protocol: dev.protocol,
      serialNumber: dev.serialNumber || '',
      doorRelayMs: dev.doorRelayMs || '3000',
      antiPassback: dev.antiPassback ?? true,
    });
    setIsModalOpen(true);
  };

  // Save or Update Device
  const handleSaveDevice = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.ipAddress.trim()) {
      return;
    }

    if (editingDevice) {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === editingDevice.id
            ? {
                ...d,
                ...formData,
              }
            : d
        )
      );
      setFeedbackMsg({ type: 'success', text: `Configuration for "${formData.name}" updated successfully.` });
    } else {
      const newDev = {
        id: `dev_${Date.now()}`,
        ...formData,
        macAddress: '70:B3:D5:' + Array.from({ length: 3 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':'),
        status: 'disconnected',
        lastSeen: 'Configured (Awaiting first handshake)',
        latencyMs: null,
        enrolledFacesCount: 0,
      };
      setDevices((prev) => [...prev, newDev]);
      setActiveDeviceId(newDev.id);
      setFeedbackMsg({ type: 'success', text: `Device "${formData.name}" added successfully.` });
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Delete Device
  const handleDeleteDevice = (id) => {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    if (activeDeviceId === id) {
      setActiveDeviceId(devices.find((d) => d.id !== id)?.id || null);
    }
    setFeedbackMsg({ type: 'info', text: 'Device removed from console.' });
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Add Default Sample Device (from empty state)
  const handleAddSampleDevice = () => {
    setDevices(INITIAL_DEVICES);
    setActiveDeviceId(INITIAL_DEVICES[0].id);
    setFeedbackMsg({ type: 'success', text: 'Sample entrance device added.' });
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // Toggle Connected / Disconnected Simulation
  const handleToggleConnection = () => {
    if (!activeDevice) return;
    const isCurrentlyConnected = activeDevice.status === 'connected';

    setIsConnecting(true);

    setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) =>
          d.id === activeDevice.id
            ? {
                ...d,
                status: isCurrentlyConnected ? 'disconnected' : 'connected',
                lastSeen: isCurrentlyConnected
                  ? 'Disconnected by Administrator'
                  : 'Just now (Simulated Heartbeat Active)',
                latencyMs: isCurrentlyConnected ? null : Math.floor(18 + Math.random() * 15),
              }
            : d
        )
      );
      setIsConnecting(false);
      setFeedbackMsg({
        type: isCurrentlyConnected ? 'info' : 'success',
        text: isCurrentlyConnected
          ? `Device "${activeDevice.name}" is now disconnected.`
          : `Device "${activeDevice.name}" is now connected. Heartbeat sync active.`,
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }, 1100);
  };

  // Test Connection (Ping & Latency Check)
  const handleTestConnection = () => {
    if (!activeDevice) return;
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      const isConnected = activeDevice.status === 'connected';
      const latency = isConnected ? Math.floor(18 + Math.random() * 14) : null;
      setTestResult({
        success: isConnected,
        latencyMs: latency,
        packetsSent: 4,
        packetsReceived: isConnected ? 4 : 0,
        packetLossPercent: isConnected ? 0 : 100,
        message: isConnected
          ? `TCP Connection Verified: Terminal at ${activeDevice.ipAddress}:${activeDevice.port} responded with 0% packet loss.`
          : `Connection Timed Out: Terminal at ${activeDevice.ipAddress}:${activeDevice.port} is unreachable or in Disconnected state.`,
      });
      setIsTesting(false);
    }, 900);
  };

  // Refresh Status
  const handleRefreshStatus = () => {
    if (!activeDevice) return;
    setDevices((prev) =>
      prev.map((d) =>
        d.id === activeDevice.id
          ? {
              ...d,
              lastSeen: d.status === 'connected' ? 'Just now (Heartbeat ACK received)' : 'Offline (No response to polling)',
              latencyMs: d.status === 'connected' ? Math.floor(18 + Math.random() * 12) : null,
            }
          : d
      )
    );
    setFeedbackMsg({ type: 'info', text: 'Device status refreshed from terminal controller.' });
    setTimeout(() => setFeedbackMsg(null), 2000);
  };

  const statusMeta = {
    connected: { label: 'Online', color: '#10B981' },
    disconnected: { label: 'Offline', color: '#F59E0B' },
    not_configured: { label: 'Not set up', color: '#94A3B8' },
  };

  const cardStyle = {
    background: 'var(--bg-card)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    padding: '20px',
  };

  const renderStatusPill = (status) => {
    const meta = statusMeta[status] || statusMeta.not_configured;
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
          color: meta.color,
          background: `${meta.color}1F`,
        }}
      >
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: meta.color }} />
        {meta.label}
      </span>
    );
  };

  const sampleEvents = [
    { time: '12:54 PM', name: 'Farhan Ahmed', code: 'FLM-1008', method: 'Face', granted: true },
    { time: '12:51 PM', name: 'Tanvir Hossain', code: 'FLM-1022', method: 'Face', granted: true },
    { time: '12:47 PM', name: 'Unknown face', code: null, method: 'Face', granted: false },
    { time: '12:42 PM', name: 'Kabir Chowdhury', code: 'FLM-1001', method: 'Fingerprint', granted: true },
  ];

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="page-title">Devices</h1>
            <span className="badge badge-warning" style={{ fontSize: '10px' }} title="Not connected to real hardware yet">
              Demo mode
            </span>
          </div>
          <p className="page-subtitle">Entrance terminals and access controllers</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Add Device
        </button>
      </div>

      {/* Feedback message */}
      {feedbackMsg && (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
            color: feedbackMsg.type === 'success' ? '#10B981' : '#3B82F6',
            fontSize: '13px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={15} /> : <Info size={15} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {devices.length === 0 ? (
        /* Empty state */
        <div style={{ ...cardStyle, padding: '48px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <ScanFace size={36} style={{ color: 'var(--text-muted)' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
              No devices yet
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '380px' }}>
              Add your entrance terminal to track check-ins and control access.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" className="btn btn-secondary" onClick={handleAddSampleDevice}>
              Add Sample Device
            </button>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Add Device
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Device switcher (only needed with more than one device) */}
          {devices.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              {devices.map((dev) => {
                const isSelected = dev.id === activeDevice?.id;
                return (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => {
                      setActiveDeviceId(dev.id);
                      setTestResult(null);
                    }}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-base)'}`,
                      background: 'var(--bg-card)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: (statusMeta[dev.status] || statusMeta.not_configured).color }} />
                    {dev.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected device */}
          {activeDevice && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ScanFace size={22} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                        {activeDevice.name}
                      </h2>
                      {renderStatusPill(activeDevice.status)}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {activeDevice.location}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${activeDevice.status === 'connected' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleToggleConnection}
                    disabled={isConnecting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    {isConnecting ? (
                      <><RefreshCw size={14} className="spin-animation" /> {activeDevice.status === 'connected' ? 'Disconnecting...' : 'Connecting...'}</>
                    ) : activeDevice.status === 'connected' ? (
                      <><WifiOff size={14} /> Disconnect</>
                    ) : (
                      <><Wifi size={14} /> Connect</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    {isTesting ? <RefreshCw size={14} className="spin-animation" /> : <Activity size={14} />}
                    {isTesting ? 'Testing...' : 'Test'}
                  </button>
                  <button type="button" className="btn-icon" onClick={handleRefreshStatus} title="Refresh status" aria-label="Refresh status">
                    <RefreshCw size={16} />
                  </button>
                  <button type="button" className="btn-icon" onClick={() => handleOpenEdit(activeDevice)} title="Edit device" aria-label="Edit device">
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleDeleteDevice(activeDevice.id)}
                    title="Remove device"
                    aria-label="Remove device"
                    style={{ color: '#EF4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Connection test result */}
              {testResult && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    color: testResult.success ? '#10B981' : '#EF4444',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  {testResult.success
                    ? `Device responded in ${testResult.latencyMs} ms`
                    : `No response from ${activeDevice.ipAddress}:${activeDevice.port}`}
                </div>
              )}

              {/* Details */}
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '16px 24px',
                  margin: '18px 0 0 0',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-base)',
                }}
              >
                {[
                  ['Address', <code key="addr">{activeDevice.ipAddress}:{activeDevice.port}</code>],
                  ['Model', activeDevice.model || '—'],
                  ['Serial number', activeDevice.serialNumber ? <code key="sn">{activeDevice.serialNumber}</code> : '—'],
                  ['Last seen', activeDevice.lastSeen],
                  ['Door unlock time', `${(Number(activeDevice.doorRelayMs) || 0) / 1000} s`],
                  ['Anti-passback', activeDevice.antiPassback ? 'On' : 'Off'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>{label}</dt>
                    <dd style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Recent access events (sample data until hardware is connected) */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>Recent access events</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sample data</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Member</th>
                    <th>Method</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleEvents.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.time}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                        {row.code && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{row.code}</div>}
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.method}</td>
                      <td>
                        <span className={`badge ${row.granted ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                          {row.granted ? 'Granted' : 'Denied'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEVICE CONFIGURATION SETUP / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDevice ? 'Edit Device' : 'Add Device'}
        subtitle="Name, location and network details"
        icon={Server}
        size="md"
      >
        <form onSubmit={handleSaveDevice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Device Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Main Entrance Face Recognition Terminal"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="Face Recognition Access Controller">Face Recognition Terminal</option>
                <option value="Fingerprint Biometric Controller">Fingerprint Scanner</option>
                <option value="Dual Face & Fingerprint Turnstile Gate">Dual Face & Fingerprint Gate</option>
                <option value="RFID Smart Card Reader">RFID Turnstile Reader</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hardware Model</label>
              <input
                type="text"
                className="form-input"
                value={formData.model}
                onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="e.g. FR-8000 Pro"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Location *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Main Gym Entrance (Turnstile Gate #1)"
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">IP Address / Hostname *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.ipAddress}
                onChange={(e) => setFormData((prev) => ({ ...prev, ipAddress: e.target.value }))}
                placeholder="192.168.1.120"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Port *</label>
              <input
                type="text"
                required
                className="form-input"
                value={formData.port}
                onChange={(e) => setFormData((prev) => ({ ...prev, port: e.target.value }))}
                placeholder="8000"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Communication Protocol</label>
              <select
                className="form-select"
                value={formData.protocol}
                onChange={(e) => setFormData((prev) => ({ ...prev, protocol: e.target.value }))}
              >
                <option value="TCP/IP WebSocket & HTTP REST">TCP/IP WebSocket & HTTP REST</option>
                <option value="Direct TCP Socket">Direct TCP Socket (Port 8000)</option>
                <option value="Wiegand / RS-485 Controller">Wiegand / RS-485 Bridge</option>
                <option value="MQTT IoT Gateway">MQTT IoT Gateway</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.serialNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="SN-FR2026-XXXXX"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Door Unlock Time (ms)</label>
              <input
                type="number"
                min="500"
                max="10000"
                className="form-input"
                value={formData.doorRelayMs}
                onChange={(e) => setFormData((prev) => ({ ...prev, doorRelayMs: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '18px', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={formData.antiPassback}
                  onChange={(e) => setFormData((prev) => ({ ...prev, antiPassback: e.target.checked }))}
                />
                <span>Anti-passback (block re-entry sharing)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDevice ? 'Save Changes' : 'Add Device'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
