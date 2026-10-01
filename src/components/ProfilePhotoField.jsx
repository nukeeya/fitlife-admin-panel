import { useEffect, useState } from 'react';

const MAX_PROFILE_PHOTO_SIZE = 15 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

export default function ProfilePhotoField({ file, onFileChange, currentPhotoUrl = '' }) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = '';
    if (!selectedFile) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!ALLOWED_PROFILE_PHOTO_TYPES.has(selectedFile.type)) {
      setPreviewUrl('');
      onFileChange(null);
      setError('Use a JPEG, PNG, GIF, WebP, or AVIF profile picture.');
      return;
    }
    if (selectedFile.size > MAX_PROFILE_PHOTO_SIZE) {
      setPreviewUrl('');
      onFileChange(null);
      setError('Profile pictures must be 15 MB or smaller.');
      return;
    }

    setPreviewUrl(URL.createObjectURL(selectedFile));
    setError('');
    onFileChange(selectedFile);
  };

  const displayedUrl = (file && previewUrl) || (
    typeof currentPhotoUrl === 'string' && currentPhotoUrl.startsWith('http') ? currentPhotoUrl : ''
  );

  return (
    <div className="form-group">
      <label className="form-label">Profile Picture (optional, up to 15 MB)</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        className="form-input"
        onChange={handleChange}
        aria-describedby={error ? 'profile-photo-error' : undefined}
      />
      {displayedUrl && (
        <img
          src={displayedUrl}
          alt="Profile picture preview"
          style={{ width: 72, height: 72, marginTop: 8, borderRadius: '50%', objectFit: 'cover' }}
        />
      )}
      {error && (
        <span id="profile-photo-error" role="alert" style={{ color: 'var(--danger)', fontSize: 12 }}>
          {error}
        </span>
      )}
    </div>
  );
}
