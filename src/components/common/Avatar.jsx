import { useState } from 'react';

/**
 * Reusable Avatar Component with Graceful Fallback
 * - Renders profile picture if available and valid
 * - On image loading failure or missing src, smoothly renders a high-contrast
 *   initials badge with a deterministic color palette.
 */

// Curated deterministic background colors for initials
const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #10B981, #047857)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #F59E0B, #B45309)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #EC4899, #BE185D)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #06B6D4, #0E7490)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #F97316, #C2410C)', text: '#FFFFFF' },
  { bg: 'linear-gradient(135deg, #6366F1, #4338CA)', text: '#FFFFFF' },
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name = '') {
  if (!name) return 'FL';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  name = 'User',
  size = 40,
  shape = 'circle', // 'circle' | 'rounded'
  className = '',
  style = {},
  showStatus = false,
  status = 'active', // 'active' | 'offline' | 'busy'
}) {
  const [hasError, setHasError] = useState(false);

  const borderRadius = shape === 'circle' ? '50%' : 'var(--radius-md, 10px)';
  const { bg, text } = getAvatarColor(name);
  const initials = getInitials(name);
  const fontSize = Math.max(11, Math.round(size * 0.38));

  const shouldRenderImage = src && !hasError && src.startsWith('http');

  const statusColors = {
    active: '#10B981',
    busy: '#EF4444',
    offline: '#64748B',
  };

  return (
    <div
      className={`app-avatar ${className}`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius,
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
        ...style,
      }}
      title={name}
    >
      {shouldRenderImage ? (
        <img
          src={src}
          alt={`${name} avatar`}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          loading="lazy"
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: bg,
            color: text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: `${fontSize}px`,
            letterSpacing: '0.5px',
          }}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            width: `${Math.max(8, Math.round(size * 0.22))}px`,
            height: `${Math.max(8, Math.round(size * 0.22))}px`,
            borderRadius: '50%',
            backgroundColor: statusColors[status] || statusColors.active,
            border: '2px solid var(--bg-card, #141416)',
          }}
        />
      )}
    </div>
  );
}
