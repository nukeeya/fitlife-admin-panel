import { useState } from 'react';
import {
  Megaphone,
  Plus,
  Eye,
  MousePointer,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function Advertisements() {
  const { ads } = useGymData();

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

        <button className="btn btn-primary" onClick={() => alert('Add Campaign modal')}>
          <Plus size={16} />
          + Launch New Campaign
        </button>
      </div>

      {/* Ads Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {ads.map((ad) => (
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
                <span>Preview Landing Page</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
