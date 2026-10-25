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

    // Hand geometry is defined once for the right palm (thumb on the left) and
    // mirrored across the 200-wide viewBox for the left hand.
    const mx = (x) => (isLeft ? 200 - x : x);
    const side = isLeft ? 'left' : 'right';
    const prefix = isLeft ? 'L' : 'R';

    // Each finger: base point (buried inside the palm), length, base/tip width,
    // and lean angle in degrees (negative leans toward the thumb side).
    const fingerSpecs = [
      { key: 'thumb', name: 'Thumb', short: 'T', bx: 82, by: 182, len: 64, wb: 32, wt: 22, angle: -48, creases: [0.68] },
      { key: 'index', name: 'Index Finger', short: 'I', bx: 81, by: 130, len: 84, wb: 24, wt: 20, angle: -8, creases: [0.58, 0.8] },
      { key: 'middle', name: 'Middle Finger', short: 'M', bx: 105, by: 124, len: 94, wb: 25, wt: 21, angle: -1, creases: [0.58, 0.8] },
      { key: 'ring', name: 'Ring Finger', short: 'R', bx: 128, by: 126, len: 86, wb: 23, wt: 19, angle: 6, creases: [0.58, 0.8] },
      { key: 'pinky', name: 'Little (Pinky)', short: 'P', bx: 148, by: 136, len: 68, wb: 20, wt: 17, angle: 14, creases: [0.6, 0.81] },
    ];

    const fingerDefs = fingerSpecs.map((s) => {
      const a = ((isLeft ? -s.angle : s.angle) * Math.PI) / 180;
      const dir = { x: Math.sin(a), y: -Math.cos(a) }; // base -> tip
      const nrm = { x: Math.cos(a), y: Math.sin(a) }; // across the finger
      const bx = mx(s.bx);
      const by = s.by;
      const tx = bx + dir.x * s.len;
      const ty = by + dir.y * s.len;
      const pt = (cx, cy, w, sign) => `${(cx + sign * nrm.x * w / 2).toFixed(1)} ${(cy + sign * nrm.y * w / 2).toFixed(1)}`;
      const r = s.wt / 2;
      // Tapered sides with a gentle knuckle bulge, capped by a rounded tip
      const midX = bx + dir.x * s.len * 0.45;
      const midY = by + dir.y * s.len * 0.45;
      const midW = (s.wb + s.wt) / 2 + 2;
      const outline = `M ${pt(bx, by, s.wb, -1)} Q ${pt(midX, midY, midW, -1)} ${pt(tx, ty, s.wt, -1)} A ${r} ${r} 0 0 1 ${pt(tx, ty, s.wt, 1)} Q ${pt(midX, midY, midW, 1)} ${pt(bx, by, s.wb, 1)}`;
      const padOffset = r * 0.25;
      const creaseLines = s.creases.map((f) => {
        const cx = bx + dir.x * s.len * f;
        const cy = by + dir.y * s.len * f;
        const w = (s.wb + (s.wt - s.wb) * f) * 0.7;
        return `M ${pt(cx, cy, w, -1)} L ${pt(cx, cy, w, 1)}`;
      });
      return {
        id: `${side}_${s.key}`,
        name: s.name,
        short: `${prefix}${s.short}`,
        path: `${outline} Z`,
        outline,
        creaseLines,
        tipX: tx - dir.x * padOffset,
        tipY: ty - dir.y * padOffset,
        radius: r - 1.5,
        angleDeg: isLeft ? -s.angle : s.angle,
      };
    });

    // Palm with a fleshy thumb heel and a narrowing wrist
    const palmPath = `M ${mx(86)} 236 C ${mx(82)} 222 ${mx(66)} 214 ${mx(62)} 192 C ${mx(58)} 170 ${mx(60)} 142 ${mx(68)} 120 Q ${mx(110)} 100 ${mx(158)} 124 C ${mx(166)} 152 ${mx(165)} 182 ${mx(152)} 208 C ${mx(147)} 218 ${mx(143)} 227 ${mx(141)} 236 Z`;

    // Heart, head and life lines
    const palmLines = [
      `M ${mx(158)} 146 C ${mx(140)} 140 ${mx(118)} 138 ${mx(96)} 132`,
      `M ${mx(70)} 152 C ${mx(96)} 156 ${mx(126)} 160 ${mx(152)} 172`,
      `M ${mx(72)} 150 C ${mx(92)} 168 ${mx(98)} 196 ${mx(96)} 222`,
    ];
    const handShapes = [palmPath, ...fingerDefs.map((f) => f.path)];

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

            {/* Hides the part of a finger buried in the palm, so the
                selection highlight starts at the knuckle line */}
            <mask id={`palmMask-${handSide}`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="236">
              <rect x="0" y="0" width="200" height="236" fill="white" />
              <path d={palmPath} fill="black" />
            </mask>
          </defs>

          {/* Hand silhouette: stroke every shape, then cover the inner seams so
              only the outer outline of the merged hand remains */}
          {handShapes.map((d, i) => (
            <path key={`edge-${i}`} d={d} fill="var(--bg-surface)" stroke="var(--border-light)" strokeWidth="3.6" strokeLinejoin="round" />
          ))}
          {handShapes.map((d, i) => (
            <path key={`fill-${i}`} d={d} fill="var(--bg-surface)" />
          ))}
          <g opacity="0.06">
            {handShapes.map((d, i) => (
              <path key={`tint-${i}`} d={d} fill="var(--text-primary)" />
            ))}
          </g>

          {/* Palm lines and knuckle creases */}
          {palmLines.map((d, i) => (
            <path key={`line-${i}`} d={d} stroke="var(--border-light)" strokeWidth="1.1" fill="none" strokeLinecap="round" opacity="0.7" />
          ))}
          {fingerDefs.flatMap((f) => f.creaseLines.map((d, i) => (
            <path key={`${f.id}-crease-${i}`} d={d} stroke="var(--border-light)" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
          )))}

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
                {/* Finger hit area / selection highlight, masked to stop at the palm */}
                <path
                  d={f.path}
                  fill={isSelected ? 'rgba(200, 255, 0, 0.22)' : 'transparent'}
                  mask={isSelected ? `url(#palmMask-${handSide})` : undefined}
                  style={{ transition: 'all 0.25s ease' }}
                />
                {isSelected && (
                  <path
                    mask={`url(#palmMask-${handSide})`}
                    d={f.outline}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    filter={`url(#glow-${handSide})`}
                  />
                )}

                {/* Animated scan beam on selected finger during capture,
                    rotated to run along the finger */}
                {isTargetScanning && (
                  <g transform={`rotate(${f.angleDeg} ${f.tipX} ${f.tipY})`}>
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
                  </g>
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
                  fontSize="7.5"
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

        {/* Simple face outline guide */}
        <svg
          viewBox="0 0 180 180"
          style={{ width: '130px', height: '130px', display: 'block', position: 'relative', zIndex: 2 }}
          role="img"
          aria-label="Face alignment outline"
        >
          <path
            d="M 90 22 C 124 22 140 50 140 84 C 140 124 116 158 90 158 C 64 158 40 124 40 84 C 40 50 56 22 90 22 Z"
            fill={accentColor}
            fillOpacity="0.06"
            stroke={accentColor}
            strokeWidth="2"
            strokeDasharray={isScanning ? '6,4' : undefined}
            strokeLinecap="round"
          />
        </svg>

        {/* Viewfinder Status Banner */}
        <div style={{ marginTop: '8px', textAlign: 'center', zIndex: 2 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isSuccess
              ? 'Face Enrolled'
              : isFailed
              ? 'Face Capture Failed'
              : isScanning
              ? 'Scanning Face...'
              : 'Ready to Scan'}
          </span>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Keep your face inside the outline and look straight ahead
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
