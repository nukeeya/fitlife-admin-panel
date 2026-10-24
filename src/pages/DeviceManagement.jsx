import React, { useState } from 'react';
import {
  ScanFace,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Activity,
  Server,
  Shield,
  Wifi,
  WifiOff,
  Cpu,
  Info,
  Clock,
  Terminal,
  Settings,
  X,
  Play,
  RotateCcw,
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
  const [connectionLog, setConnectionLog] = useState('');
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
    setConnectionLog(
      isCurrentlyConnected
        ? `Initiating safe disconnect handshake with terminal at ${activeDevice.ipAddress}:${activeDevice.port}...`
        : `Connecting to biometric terminal at ${activeDevice.ipAddress}:${activeDevice.port}...`
    );

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
      setConnectionLog('');
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

  return (
    <div className="page" style={{ paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(200, 255, 0, 0.12)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <ScanFace size={12} /> Access Control & Biometrics
            </span>
          </div>
          <h1 className="page-title">Device Management</h1>
          <p className="page-subtitle">
            Entrance Face Recognition Terminals • Turnstile Access Controllers • Hardware Status Monitoring
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenAdd}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          Configure New Device
        </button>
      </div>

      {/* FEEDBACK TOAST ALERT */}
      {feedbackMsg && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background:
              feedbackMsg.type === 'success'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(59, 130, 246, 0.12)',
            border: `1px solid ${
              feedbackMsg.type === 'success' ? '#10B981' : '#3B82F6'
            }`,
            color: feedbackMsg.type === 'success' ? '#10B981' : '#3B82F6',
            fontSize: '13px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* HARDWARE INTEGRATION PREPARATION NOTICE */}
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={20} style={{ color: '#3B82F6', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Hardware Integration Architecture Prepared:</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              This interface is ready for your backend developer to connect real Hikvision, ZKTeco, or Suprema biometric access control SDKs/APIs. The connection states, ping diagnostics, and configuration forms run as a frontend demonstration without requiring physical hardware credentials.
            </span>
          </div>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '10px' }}>
          Frontend Demo Mode
        </span>
      </div>

      {/* EMPTY STATE (When no devices configured) */}
      {devices.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '50px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <Radio size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              No Access Control Device Configured
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
              Connect your entrance face recognition terminal or turnstile gate controller to monitor attendance events and manage real-time access.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn btn-secondary" onClick={handleAddSampleDevice}>
              Add Sample Entrance Device
            </button>
            <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} /> Configure Custom Device
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* DEVICE SELECTOR TABS (If multiple devices configured) */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            {devices.map((dev) => {
              const isSelected = dev.id === activeDevice?.id;
              const isConnected = dev.status === 'connected';

              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => {
                    setActiveDeviceId(dev.id);
                    setTestResult(null);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-base)'}`,
                    background: isSelected ? 'rgba(200, 255, 0, 0.08)' : 'var(--bg-card)',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                    transition: 'var(--transition-smooth)',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isConnected ? '#10B981' : dev.status === 'disconnected' ? '#F59E0B' : '#94A3B8',
                      boxShadow: isConnected ? '0 0 8px #10B981' : 'none',
                    }}
                  />
                  <span>{dev.name}</span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE DEVICE OVERVIEW CARD */}
          {activeDevice && (
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '20px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* Card Header: Device Name, Type, Location, Status Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '14px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--border-base)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-md)',
                      background:
                        activeDevice.status === 'connected'
                          ? 'rgba(16, 185, 129, 0.12)'
                          : 'rgba(245, 158, 11, 0.12)',
                      color: activeDevice.status === 'connected' ? '#10B981' : '#F59E0B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ScanFace size={26} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {activeDevice.name}
                      </h2>

                      {/* Connection Status Badge */}
                      {activeDevice.status === 'connected' && (
                        <span
                          className="badge badge-success"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            padding: '3px 8px',
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: '#10B981',
                              boxShadow: '0 0 6px #10B981',
                            }}
                          />
                          Connected
                        </span>
                      )}

                      {activeDevice.status === 'disconnected' && (
                        <span
                          className="badge badge-warning"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '11px',
                            padding: '3px 8px',
                          }}
                        >
                          <WifiOff size={11} />
                          Disconnected
                        </span>
                      )}

                      {activeDevice.status === 'not_configured' && (
                        <span className="badge badge-secondary" style={{ fontSize: '11px', padding: '3px 8px' }}>
                          Not Configured
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>{activeDevice.type}</strong> • Location: <span style={{ color: 'var(--text-primary)' }}>{activeDevice.location}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Controls: Connect / Disconnect, Refresh, Test, Edit */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={`btn ${activeDevice.status === 'connected' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleToggleConnection}
                    disabled={isConnecting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={14} className="spin-animation" />
                        Handshaking...
                      </>
                    ) : activeDevice.status === 'connected' ? (
                      <>
                        <WifiOff size={14} />
                        Disconnect Device
                      </>
                    ) : (
                      <>
                        <Wifi size={14} />
                        Connect Device
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    title="Send ping packets to test network responsiveness"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw size={14} className="spin-animation" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Activity size={14} />
                        Test Connection
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleRefreshStatus}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    title="Poll device status"
                  >
                    <RefreshCw size={14} />
                    Refresh Status
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleOpenEdit(activeDevice)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteDevice(activeDevice.id)}
                    title="Remove device"
                    style={{ padding: '0 8px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Connecting State Log Message */}
              {isConnecting && connectionLog && (
                <div
                  style={{
                    margin: '14px 0',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(200, 255, 0, 0.08)',
                    border: '1px solid rgba(200, 255, 0, 0.25)',
                    fontSize: '12px',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RefreshCw size={14} className="spin-animation" />
                  <span>{connectionLog}</span>
                </div>
              )}

              {/* Ping Test Diagnostic Result */}
              {testResult && (
                <div
                  style={{
                    margin: '14px 0',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: testResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {testResult.success ? (
                        <CheckCircle2 size={16} color="#10B981" />
                      ) : (
                        <AlertCircle size={16} color="#EF4444" />
                      )}
                      <strong style={{ color: testResult.success ? '#10B981' : '#EF4444' }}>
                        {testResult.success ? 'Network Ping Test Passed' : 'Network Ping Test Failed'}
                      </strong>
                    </div>
                    {testResult.latencyMs && (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>
                        Latency: {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {testResult.message}
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Diagnostics: {testResult.packetsSent} packets transmitted, {testResult.packetsReceived} received, {testResult.packetLossPercent}% packet loss.
                  </div>
                </div>
              )}

              {/* DEVICE DETAILS & CONFIGURATION GRID */}
              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  Device Configuration & Operational Parameters
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IP Address / Host</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                      <code>{activeDevice.ipAddress}</code>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Port</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                      <code>{activeDevice.port}</code>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protocol</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                      {activeDevice.protocol}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last Seen / Heartbeat</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: activeDevice.status === 'connected' ? '#10B981' : 'var(--text-muted)' }}>
                      {activeDevice.lastSeen}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MAC Address</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                      <code>{activeDevice.macAddress}</code>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Serial Number</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                      <code>{activeDevice.serialNumber || 'SN-FR2026-99412'}</code>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Door Relay Open Pulse</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: 'var(--text-primary)' }}>
                      {activeDevice.doorRelayMs} ms (Turnstile Unlock)
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-base)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Anti-Passback Rule</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px', color: activeDevice.antiPassback ? '#10B981' : 'var(--text-muted)' }}>
                      {activeDevice.antiPassback ? 'Enabled (Prevents re-entry sharing)' : 'Disabled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACCESS LOG DEMONSTRATION BUFFER */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Live Terminal Access Event Stream (Simulated Hardware Feed)
                </h3>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                WebSocket Sync Buffer
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Member / Visitor</th>
                    <th>ID / Code</th>
                    <th>Method</th>
                    <th>Device & Door</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: '12:54:12 PM', name: 'Farhan Ahmed', code: 'FLM-1008', method: 'Face Recognition', door: 'Turnstile #1 (Entrance)', result: 'ACCESS GRANTED' },
                    { time: '12:51:05 PM', name: 'Tanvir Hossain', code: 'FLM-1022', method: 'Face Recognition', door: 'Turnstile #1 (Entrance)', result: 'ACCESS GRANTED' },
                    { time: '12:47:30 PM', name: 'Unknown Face', code: 'N/A', method: 'Face Recognition', door: 'Turnstile #1 (Entrance)', result: 'ACCESS DENIED (Unenrolled)' },
                    { time: '12:42:18 PM', name: 'Shakib Al Hasan', code: 'FLM-1001', method: 'Fingerprint (R Index)', door: 'Turnstile #1 (Entrance)', result: 'ACCESS GRANTED' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <code>{row.time}</code>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {row.name}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                        <code>{row.code}</code>
                      </td>
                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: '11px' }}>
                          {row.method}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {row.door}
                      </td>
                      <td>
                        <span
                          className={`badge ${row.result.includes('GRANTED') ? 'badge-success' : 'badge-danger'}`}
                          style={{ fontSize: '11px' }}
                        >
                          {row.result}
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
        title={editingDevice ? `Edit Device: ${editingDevice.name}` : 'Configure New Access Control Device'}
        subtitle="Specify device identity, network IP, communication protocol, and turnstile parameters"
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
              <label className="form-label">Door Relay Open Pulse (ms)</label>
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
                <span>Enable Anti-Passback Protection</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingDevice ? 'Update Configuration' : 'Save & Register Device'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
