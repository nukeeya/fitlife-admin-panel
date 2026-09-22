import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Eye,
  MousePointer,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';
import Modal from '../components/common/Modal';

export default function Advertisements() {
  const { ads } = useGymData();
  const [adList, setAdList] = useState(ads);
  const [showAddAdModal, setShowAddAdModal] = useState(false);

  // New Ad Form State
  const [newAd, setNewAd] = useState({
    title: '',
    position: 'Dashboard Header Banner',
    targetUrl: 'https://fitlife.com/promo',
    bannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-10-31',
  });

  const handleCreateAd = (e) => {
    e.preventDefault();
    if (!newAd.title.trim()) return;

    const created = {
      id: Date.now(),
      title: newAd.title.trim(),
      position: newAd.position,
      targetUrl: newAd.targetUrl.trim() || 'https://fitlife.com',
      bannerUrl: newAd.bannerUrl.trim(),
      impressions: 0,
      clicks: 0,
      startDate: newAd.startDate,
      endDate: newAd.endDate,
      status: 'Active',
    };

    setAdList((prev) => [created, ...prev]);
    setShowAddAdModal(false);
    setNewAd({
      title: '',
      position: 'Dashboard Header Banner',
      targetUrl: 'https://fitlife.com/promo',
      bannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-10-31',
    });
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Advertisements & Marketing Banners</h1>
          <p className="page-subtitle">
            Manage promotional campaigns, gym TV displays, mobile app cards, impressions and click telemetry.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowAddAdModal(true)}
        >
          <Plus size={16} />
          + Launch New Campaign
        </button>
      </div>

      {/* Ads Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {adList.map((ad) => (
          <div
            key={ad.id}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-base)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ height: '160px', position: 'relative', overflow: 'hidden' }}>
              <img
                src={ad.bannerUrl}
                alt={ad.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span
                className={`badge ${ad.status === 'Active' ? 'badge-success' : 'badge-danger'}`}
                style={{ position: 'absolute', top: '12px', right: '12px' }}
              >
                {ad.status}
              </span>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase' }}>
                  {ad.position}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginTop: '2px' }}>{ad.title}</h3>
              </div>

              <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={14} color="var(--primary)" />
                  <span><strong>{ad.impressions.toLocaleString()}</strong> Views</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MousePointer size={14} color="#10B981" />
                  <span><strong>{ad.clicks.toLocaleString()}</strong> Clicks</span>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <Calendar size={12} />
                  <span>{ad.startDate} to {ad.endDate}</span>
                </div>
              </div>

              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <span>Preview Target Link</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Standardized Launch Marketing Campaign Modal */}
      <Modal
        isOpen={showAddAdModal}
        onClose={() => setShowAddAdModal(false)}
        title="Launch New Marketing Campaign"
        subtitle="Publish promotional creatives to gym displays and member portals"
        icon={Megaphone}
        size="md"
      >
        <form onSubmit={handleCreateAd}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Campaign Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Monsoon Flash Sale - 25% Off VIP Passes"
                className="form-input"
                value={newAd.title}
                onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Display Placement Zone</label>
              <select
                className="form-select"
                value={newAd.position}
                onChange={(e) => setNewAd({ ...newAd, position: e.target.value })}
              >
                <option value="Dashboard Header Banner">Dashboard Header Banner</option>
                <option value="Member Mobile App Card">Member Mobile App Card</option>
                <option value="Locker TV Digital Display">Locker TV Digital Display</option>
                <option value="Reception Check-In Screen">Reception Check-In Screen</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Banner Image URL</label>
              <input
                type="url"
                required
                className="form-input"
                value={newAd.bannerUrl}
                onChange={(e) => setNewAd({ ...newAd, bannerUrl: e.target.value })}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setNewAd({ ...newAd, bannerUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80' })}
                >
                  Preset 1: Weights
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setNewAd({ ...newAd, bannerUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80' })}
                >
                  Preset 2: Nutrition
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setNewAd({ ...newAd, bannerUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80' })}
                >
                  Preset 3: Training
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Destination Landing URL</label>
              <input
                type="text"
                placeholder="https://fitlife.com/special-offer"
                className="form-input"
                value={newAd.targetUrl}
                onChange={(e) => setNewAd({ ...newAd, targetUrl: e.target.value })}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newAd.startDate}
                  onChange={(e) => setNewAd({ ...newAd, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newAd.endDate}
                  onChange={(e) => setNewAd({ ...newAd, endDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddAdModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Launch Campaign
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
