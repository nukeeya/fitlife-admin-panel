import { useState, useEffect } from 'react';
import {
  Fingerprint,
  ScanFace,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  X,
  Camera,
  Info,
  Check,
  RotateCcw,
} from 'lucide-react';
import Avatar from './common/Avatar';

// Finger identifiers and labels for Left and Right hands
const FINGERS_DATA = {
  left: [
    { id: 'left_pinky', name: 'Little (Pinky)', short: 'LP', number: 10 },
    { id: 'left_ring', name: 'Ring Finger', short: 'LR', number: 9 },
    { id: 'left_middle', name: 'Middle Finger', short: 'LM', number: 8 },
    { id: 'left_index', name: 'Index Finger', short: 'LI', number: 7 },
    { id: 'left_thumb', name: 'Thumb', short: 'LT', number: 6 },
  ],
  right: [
    { id: 'right_thumb', name: 'Thumb', short: 'RT', number: 1 },
    { id: 'right_index', name: 'Index Finger', short: 'RI', number: 2 },
    { id: 'right_middle', name: 'Middle Finger', short: 'RM', number: 3 },
    { id: 'right_ring', name: 'Ring Finger', short: 'RR', number: 4 },
    { id: 'right_pinky', name: 'Little (Pinky)', short: 'RP', number: 5 },
  ],
};

export default function RemoteEnrollModal({ isOpen, onClose, member }) {
  const [activeTab, setActiveTab] = useState('fingerprint'); // 'fingerprint' | 'face'
  const [selectedFinger, setSelectedFinger] = useState('right_index');

  // Enrollment states: 'ready' | 'in_progress' | 'success' | 'failed'
  const [enrollStatus, setEnrollStatus] = useState('ready');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to capture biometric template.');
  const [simulatedTemplateId, setSimulatedTemplateId] = useState('');
  const [shouldFailSimulation, setShouldFailSimulation] = useState(false);

  // Reset state when opening or switching member
  useEffect(() => {
    if (isOpen) {
      setEnrollStatus('ready');
      setProgress(0);
      setStatusMessage('Ready to capture biometric template.');
      setSimulatedTemplateId('');
      setShouldFailSimulation(false);
    }
  }, [isOpen, member?.id]);

  if (!isOpen || !member) return null;

  const allFingers = [...FINGERS_DATA.left, ...FINGERS_DATA.right];
  const currentFingerObj = allFingers.find((f) => f.id === selectedFinger) || FINGERS_DATA.right[1];
  const isLeftHandSelected = selectedFinger.startsWith('left_');

  const handleStartEnrollment = () => {
    setEnrollStatus('in_progress');
    setProgress(15);
    setStatusMessage('Initiating hardware handshake with entrance terminal...');

    const step1 = setTimeout(() => {
      setProgress(45);
      setStatusMessage(
        activeTab === 'fingerprint'
          ? `Scanning optical ridge details for ${isLeftHandSelected ? 'Left' : 'Right'} ${currentFingerObj.name}...`
          : 'Detecting facial coordinates, landmark nodes & anti-spoofing depth...'
      );
    }, 850);

    const step2 = setTimeout(() => {
      setProgress(78);
      setStatusMessage(
        activeTab === 'fingerprint'
          ? 'Extracting minutiae points & matching ridge quality threshold (98%)...'
          : 'Computing 128-dimensional biometric facial embedding vector...'
      );
    }, 1750);

    const step3 = setTimeout(() => {
      if (shouldFailSimulation) {
        setProgress(85);
        setEnrollStatus('failed');
        setStatusMessage(
          activeTab === 'fingerprint'
            ? 'Enrollment Failed: Minutiae quality score insufficient (36/100). Please ensure finger is centered on sensor glass and try again.'
            : 'Enrollment Failed: Excessive head rotation or low lighting detected. Position face straight towards terminal camera.'
        );
      } else {
        setProgress(100);
        setEnrollStatus('success');
        const randId = Math.floor(10000 + Math.random() * 90000);
        const code = member.code || `FLM-${member.id}`;
        setSimulatedTemplateId(
          activeTab === 'fingerprint'
            ? `FP-BIO-${code}-${currentFingerObj.short}-${randId}`
            : `FACE-BIO-${code}-${randId}`
        );
        setStatusMessage(
          activeTab === 'fingerprint'
            ? `Biometric fingerprint template successfully enrolled for ${isLeftHandSelected ? 'Left' : 'Right'} ${currentFingerObj.name}. Template stored in local terminal buffer.`
            : '3D Face Recognition template successfully enrolled with 99.4% confidence score.'
        );
      }
    }, 2700);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  const handleRetry = () => {
    setEnrollStatus('ready');
    setProgress(0);
    setStatusMessage('Ready to retry biometric template capture.');
  };

  // SVG Hand Drawing Component
  const renderHandSVG = (handSide) => {
    const isLeft = handSide === 'left';
    const isScanning = enrollStatus === 'in_progress';

    // Finger configurations for SVG rendering
    // Left hand: Little (leftmost), Ring, Middle, Index, Thumb (rightmost)
    // Right hand: Thumb (leftmost), Index, Middle, Ring, Little (rightmost)
    const fingerDefs = isLeft
      ? [
          { id: 'left_pinky', name: 'Little (Pinky)', short: 'LP', path: 'M 26 140 L 26 82 C 26 70 40 70 40 82 L 40 142 Z', tipX: 33, tipY: 82, radius: 10 },
          { id: 'left_ring', name: 'Ring Finger', short: 'LR', path: 'M 48 135 L 48 52 C 48 40 64 40 64 52 L 64 135 Z', tipX: 56, tipY: 52, radius: 11 },
          { id: 'left_middle', name: 'Middle Finger', short: 'LM', path: 'M 72 130 L 72 34 C 72 20 90 20 90 34 L 90 130 Z', tipX: 81, tipY: 34, radius: 12 },
          { id: 'left_index', name: 'Index Finger', short: 'LI', path: 'M 98 135 L 98 50 C 98 38 114 38 114 50 L 114 138 Z', tipX: 106, tipY: 50, radius: 11 },
          { id: 'left_thumb', name: 'Thumb', short: 'LT', path: 'M 124 162 L 152 110 C 160 96 174 106 166 120 L 138 178 Z', tipX: 160, tipY: 112, radius: 12 },
        ]
      : [
          { id: 'right_thumb', name: 'Thumb', short: 'RT', path: 'M 76 162 L 48 110 C 40 96 26 106 34 120 L 62 178 Z', tipX: 40, tipY: 112, radius: 12 },
          { id: 'right_index', name: 'Index Finger', short: 'RI', path: 'M 86 138 L 86 50 C 86 38 102 38 102 50 L 102 135 Z', tipX: 94, tipY: 50, radius: 11 },
          { id: 'right_middle', name: 'Middle Finger', short: 'RM', path: 'M 110 130 L 110 34 C 110 20 128 20 128 34 L 128 130 Z', tipX: 119, tipY: 34, radius: 12 },
          { id: 'right_ring', name: 'Ring Finger', short: 'RR', path: 'M 136 135 L 136 52 C 136 40 152 40 152 52 L 152 135 Z', tipX: 144, tipY: 52, radius: 11 },
          { id: 'right_pinky', name: 'Little (Pinky)', short: 'RP', path: 'M 160 142 L 160 82 C 160 70 174 70 174 82 L 174 140 Z', tipX: 167, tipY: 82, radius: 10 },
        ];

    // Palm base path
    const palmPath = isLeft
      ? 'M 30 140 Q 20 170 34 205 Q 45 228 72 228 L 126 228 Q 146 228 142 195 L 128 162 Q 80 142 30 140 Z'
      : 'M 170 140 Q 180 170 166 205 Q 155 228 128 228 L 74 228 Q 54 228 58 195 L 72 162 Q 120 142 170 140 Z';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'var(--bg-surface)',
          padding: '14px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-base)',
          flex: 1,
          minWidth: '220px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px', padding: '0 6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
            {isLeft ? 'Left Hand' : 'Right Hand'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {isLeft ? 'Fingers 10 – 6' : 'Fingers 1 – 5'}
          </span>
        </div>

        <svg
          viewBox="0 0 200 236"
          style={{ width: '100%', maxWidth: '210px', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`${isLeft ? 'Left' : 'Right'} Hand Diagram`}
        >
          <defs>
            {/* Pulsing glow filter for selected finger */}
            <filter id={`glow-${handSide}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Laser scanning gradient */}
            <linearGradient id={`scanGrad-${handSide}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Palm base outline */}
          <path
            d={palmPath}
            fill="rgba(255, 255, 255, 0.03)"
            stroke="var(--border-light)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Palm creases for realistic hand detail */}
          {isLeft ? (
            <>
              <path d="M 44 175 Q 75 185 110 168" stroke="var(--border-base)" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
              <path d="M 50 195 Q 85 198 120 182" stroke="var(--border-base)" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
            </>
          ) : (
            <>
              <path d="M 156 175 Q 125 185 90 168" stroke="var(--border-base)" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
              <path d="M 150 195 Q 115 198 80 182" stroke="var(--border-base)" strokeWidth="1.2" fill="none" strokeDasharray="2,2" />
            </>
          )}

          {/* Interactive Fingers */}
          {fingerDefs.map((f) => {
            const isSelected = selectedFinger === f.id;
            const isTargetScanning = isSelected && isScanning;

            return (
              <g
                key={f.id}
                onClick={() => {
                  if (enrollStatus !== 'in_progress') {
                    setSelectedFinger(f.id);
                  }
                }}
                style={{ cursor: enrollStatus === 'in_progress' ? 'default' : 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={`${f.name} (${f.short})`}
              >
                {/* Finger silhouette */}
                <path
                  d={f.path}
                  fill={isSelected ? 'rgba(200, 255, 0, 0.22)' : 'rgba(255, 255, 255, 0.05)'}
                  stroke={isSelected ? 'var(--primary)' : 'var(--border-light)'}
                  strokeWidth={isSelected ? '2.5' : '1.5'}
                  strokeLinejoin="round"
                  filter={isSelected ? `url(#glow-${handSide})` : undefined}
                  style={{ transition: 'all 0.25s ease' }}
                />

                {/* Animated scan beam on selected finger during capture */}
                {isTargetScanning && (
                  <rect
                    x={f.tipX - f.radius - 2}
                    y={f.tipY - 6}
                    width={(f.radius + 2) * 2}
                    height="12"
                    rx="3"
                    fill={`url(#scanGrad-${handSide})`}
                    className="finger-scan-beam"
                  >
                    <animate
                      attributeName="y"
                      values={`${f.tipY - 8};${f.tipY + 45};${f.tipY - 8}`}
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.4;1;0.4"
                      dur="1.4s"
                      repeatCount="indefinite"
                    />
                  </rect>
                )}

                {/* Fingertip target pad / touch sensor node */}
                <circle
                  cx={f.tipX}
                  cy={f.tipY}
                  r={isSelected ? f.radius + 2 : f.radius}
                  fill={isSelected ? 'var(--primary)' : 'rgba(0, 0, 0, 0.45)'}
                  stroke={isSelected ? '#000' : 'var(--border-base)'}
                  strokeWidth={isSelected ? '1.8' : '1'}
                  style={{ transition: 'all 0.25s ease' }}
                />

                {/* Finger code text (LP, LI, LM, etc.) */}
                <text
                  x={f.tipX}
                  y={f.tipY + 3.5}
                  textAnchor="middle"
                  fill={isSelected ? '#000' : 'var(--text-secondary)'}
                  fontSize="8.5"
                  fontWeight="800"
                  fontFamily="system-ui, sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {f.short}
                </text>
              </g>
            );
          })}
        </svg>

        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Click any finger pad to select
        </span>
      </div>
    );
  };

  // SVG Face Outline Component
  const renderFaceViewfinder = () => {
    const isScanning = enrollStatus === 'in_progress';
    const isSuccess = enrollStatus === 'success';
    const isFailed = enrollStatus === 'failed';

    const accentColor = isSuccess ? '#10B981' : isFailed ? '#EF4444' : 'var(--primary)';

    return (
      <div
        style={{
          width: '100%',
          height: '240px',
          borderRadius: 'var(--radius-lg)',
          background: 'radial-gradient(circle at center, #181822 0%, #0d0d14 100%)',
          border: `1.5px solid ${isScanning ? 'var(--primary)' : 'var(--border-base)'}`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isScanning ? '0 0 20px rgba(200, 255, 0, 0.15)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* High-Tech Viewfinder Corner Brackets */}
        <div style={{ position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderTop: `2.5px solid ${accentColor}`, borderLeft: `2.5px solid ${accentColor}` }} />
        <div style={{ position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderTop: `2.5px solid ${accentColor}`, borderRight: `2.5px solid ${accentColor}` }} />
        <div style={{ position: 'absolute', bottom: 14, left: 14, width: 22, height: 22, borderBottom: `2.5px solid ${accentColor}`, borderLeft: `2.5px solid ${accentColor}` }} />
        <div style={{ position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderBottom: `2.5px solid ${accentColor}`, borderRight: `2.5px solid ${accentColor}` }} />

        {/* Moving Laser Scan Line (active during scanning) */}
        {isScanning && (
          <div
            style={{
              position: 'absolute',
              left: 20,
              right: 20,
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)',
              boxShadow: '0 0 12px var(--primary)',
              zIndex: 5,
              animation: 'faceLaserScan 1.6s ease-in-out infinite alternate',
            }}
          />
        )}

        {/* Anatomical Face Outline SVG Graphic */}
        <svg
          viewBox="0 0 180 180"
          style={{ width: '130px', height: '130px', display: 'block', position: 'relative', zIndex: 2 }}
          role="img"
          aria-label="Facial Biometric Landmark Frame"
        >
          {/* Outer facial contour: jawline and forehead */}
          <path
            d="M 50 50 C 40 85 45 125 90 148 C 135 125 140 85 130 50 C 120 30 60 30 50 50 Z"
            fill="none"
            stroke={accentColor}
            strokeWidth="1.8"
            strokeDasharray={isScanning ? '4,2' : undefined}
          />

          {/* Subtle ears */}
          <path d="M 46 72 Q 38 85 46 98" fill="none" stroke="var(--border-light)" strokeWidth="1.5" />
          <path d="M 134 72 Q 142 85 134 98" fill="none" stroke="var(--border-light)" strokeWidth="1.5" />

          {/* Eyebrows */}
          <path d="M 60 68 Q 72 64 82 68" fill="none" stroke={accentColor} strokeWidth="1.6" />
          <path d="M 98 68 Q 108 64 120 68" fill="none" stroke={accentColor} strokeWidth="1.6" />

          {/* Eye Reticles */}
          <circle cx="72" cy="78" r="7" fill="none" stroke={accentColor} strokeWidth="1.4" />
          <circle cx="72" cy="78" r="2.5" fill={accentColor} />

          <circle cx="108" cy="78" r="7" fill="none" stroke={accentColor} strokeWidth="1.4" />
          <circle cx="108" cy="78" r="2.5" fill={accentColor} />

          {/* Nose bridge and tip */}
          <path d="M 90 75 L 87 96 L 93 96 Z" fill="none" stroke={accentColor} strokeWidth="1.4" />

          {/* Mouth line */}
          <path d="M 75 116 Q 90 122 105 116" fill="none" stroke={accentColor} strokeWidth="1.6" />

          {/* Biometric landmark nodes */}
          <circle cx="90" cy="52" r="2" fill={accentColor} />
          <circle cx="60" cy="98" r="2" fill={accentColor} />
          <circle cx="120" cy="98" r="2" fill={accentColor} />
          <circle cx="90" cy="136" r="2" fill={accentColor} />

          {/* Connecting triangulation lines */}
          {isScanning && (
            <>
              <line x1="72" y1="78" x2="90" y2="96" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.6" strokeDasharray="2,2" />
              <line x1="108" y1="78" x2="90" y2="96" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.6" strokeDasharray="2,2" />
              <line x1="90" y1="96" x2="90" y2="116" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.6" strokeDasharray="2,2" />
              <line x1="72" y1="78" x2="108" y2="78" stroke={accentColor} strokeWidth="0.8" strokeOpacity="0.6" strokeDasharray="2,2" />
            </>
          )}
        </svg>

        {/* Viewfinder Status Banner */}
        <div style={{ marginTop: '8px', textAlign: 'center', zIndex: 2 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isSuccess
              ? 'Biometric Face Geometry Verified'
              : isFailed
              ? 'Facial Landmark Capture Failed'
              : isScanning
              ? 'Scanning 128 Biometric Vector Points...'
              : 'Face Alignment Viewfinder Ready'}
          </span>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            AI Optical Sensor Handshake • 3D Depth Biometric Mesh
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-base)',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: 'auto',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(200, 255, 0, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {activeTab === 'fingerprint' ? <Fingerprint size={22} /> : <ScanFace size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Remote Biometric Enrollment: {member.name}
                </h2>
                <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                  {member.code || `ID #${member.id}`}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Terminal Hardware Template Registration • {member.plan || 'Standard Member'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Member Profile Quick Bar */}
        <div
          style={{
            padding: '8px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid var(--border-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Avatar name={member.name} photo={member.avatar || member.photo} size={26} />
            <span>
              Member: <strong style={{ color: 'var(--text-primary)' }}>{member.name}</strong> ({member.code || member.id})
            </span>
            <span>•</span>
            <span>Phone: {member.phone || 'N/A'}</span>
          </div>
          <div>
            Status: <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 6px' }}>{member.status || 'Active'}</span>
          </div>
        </div>

        {/* Biometric Type Selector Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-base)',
            background: 'var(--bg-card)',
            padding: '0 20px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('fingerprint');
              handleRetry();
            }}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'fingerprint' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'fingerprint' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)',
            }}
          >
            <Fingerprint size={16} />
            1. Fingerprint Enrollment
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('face');
              handleRetry();
            }}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'face' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              borderBottom: activeTab === 'face' ? '2px solid var(--primary)' : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'var(--transition-smooth)',
            }}
          >
            <ScanFace size={16} />
            2. Face Recognition Enrollment
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '18px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* TAB 1: FINGERPRINT ENROLLMENT */}
          {activeTab === 'fingerprint' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Instructions and Selected Finger Header */}
              <div
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-base)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Target Finger Selected: <span style={{ color: 'var(--primary)' }}>{isLeftHandSelected ? 'Left' : 'Right'} {currentFingerObj.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Click any fingertip pad below to change selection, then press Start Enrollment.
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-primary" style={{ fontSize: '11px', padding: '3px 8px' }}>
                    Finger #{currentFingerObj.number} ({currentFingerObj.short})
                  </span>
                </div>
              </div>

              {/* Hand Outline Illustrations Side-by-Side */}
              <div
                style={{
                  display: 'flex',
                  gap: '14px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {renderHandSVG('left')}
                {renderHandSVG('right')}
              </div>
            </div>
          )}

          {/* TAB 2: FACE RECOGNITION ENROLLMENT */}
          {activeTab === 'face' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Viewfinder graphic */}
              {renderFaceViewfinder()}

              {/* Instructions checklist */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-base)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '12px',
                }}
              >
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '12px', textTransform: 'uppercase' }}>
                  Face Positioning Instructions:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Check size={14} color="var(--primary)" />
                  <span>Maintain a distance of 0.5m – 1.0m directly facing the terminal camera lens.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Check size={14} color="var(--primary)" />
                  <span>Keep a neutral facial expression with eyes open and centered in the reticle.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Check size={14} color="var(--primary)" />
                  <span>Avoid hats, sunglasses, heavy face coverings, or intense direct backlighting.</span>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATION CONTROLS & STATUS CARD */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background:
                enrollStatus === 'success'
                  ? 'rgba(16, 185, 129, 0.08)'
                  : enrollStatus === 'failed'
                  ? 'rgba(239, 68, 68, 0.08)'
                  : enrollStatus === 'in_progress'
                  ? 'rgba(200, 255, 0, 0.06)'
                  : 'var(--bg-surface)',
              border: `1px solid ${
                enrollStatus === 'success'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : enrollStatus === 'failed'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : enrollStatus === 'in_progress'
                  ? 'rgba(200, 255, 0, 0.3)'
                  : 'var(--border-base)'
              }`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {/* Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {enrollStatus === 'in_progress' && (
                  <RefreshCw size={16} className="spin-animation" style={{ color: 'var(--primary)' }} />
                )}
                {enrollStatus === 'success' && (
                  <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                )}
                {enrollStatus === 'failed' && (
                  <AlertCircle size={16} style={{ color: '#EF4444' }} />
                )}
                {enrollStatus === 'ready' && (
                  <Camera size={16} style={{ color: 'var(--text-muted)' }} />
                )}
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color:
                      enrollStatus === 'success'
                        ? '#10B981'
                        : enrollStatus === 'failed'
                        ? '#EF4444'
                        : enrollStatus === 'in_progress'
                        ? 'var(--primary)'
                        : 'var(--text-secondary)',
                  }}
                >
                  {enrollStatus === 'ready' && 'Status: Ready to Capture Template'}
                  {enrollStatus === 'in_progress' && 'Status: Capture in Progress...'}
                  {enrollStatus === 'success' && 'Status: Biometric Template Enrolled'}
                  {enrollStatus === 'failed' && 'Status: Enrollment Failed'}
                </span>
              </div>

              {/* Error Simulation Toggle */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                title="Toggle to simulate terminal sensor error/retry response"
              >
                <input
                  type="checkbox"
                  checked={shouldFailSimulation}
                  onChange={(e) => setShouldFailSimulation(e.target.checked)}
                  disabled={enrollStatus === 'in_progress'}
                />
                Simulate Hardware Error
              </label>
            </div>

            {/* Progress Bar */}
            {enrollStatus !== 'ready' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: 'var(--border-base)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background:
                        enrollStatus === 'success'
                          ? '#10B981'
                          : enrollStatus === 'failed'
                          ? '#EF4444'
                          : 'var(--primary)',
                      transition: 'width 0.35s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>{progress}% Completed</span>
                  <span>{enrollStatus === 'in_progress' ? 'Communicating with Terminal...' : 'Handshake Completed'}</span>
                </div>
              </div>
            )}

            {/* Status Message Text */}
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {statusMessage}
            </p>

            {/* Success Details Badge */}
            {enrollStatus === 'success' && simulatedTemplateId && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}
              >
                <div>
                  <strong style={{ color: '#10B981' }}>Registered Template ID:</strong>{' '}
                  <code style={{ color: 'var(--text-primary)', marginLeft: 4 }}>{simulatedTemplateId}</code>
                </div>
                <span className="badge badge-success" style={{ fontSize: '10px' }}>
                  Synced to Terminal Buffer
                </span>
              </div>
            )}
          </div>

          {/* Frontend Limitation Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}
          >
            <Info size={14} style={{ color: '#3B82F6', flexShrink: 0 }} />
            <span>
              <strong>Frontend-Only Simulation:</strong> Biometric scanning animations and templates are simulated locally. No real camera or sensor hardware is accessed. Real device SDK will be plugged in by the backend engineer.
            </span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={enrollStatus === 'in_progress'}
          >
            Close
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            {enrollStatus === 'failed' && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleRetry}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} />
                Retry
              </button>
            )}

            {enrollStatus === 'success' ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle2 size={16} />
                Done & Close
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartEnrollment}
                disabled={enrollStatus === 'in_progress'}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {enrollStatus === 'in_progress' ? (
                  <>
                    <RefreshCw size={15} className="spin-animation" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Start Enrollment
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
