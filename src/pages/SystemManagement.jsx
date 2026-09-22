import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Percent,
  Check,
  X,
  Plus,
  Users,
  Lock,
  Building2,
  Image as ImageIcon,
  Flame,
  Dumbbell,
  Award,
  Zap,
  Activity,
  Upload,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function SystemManagement() {
  const {
    roles,
    updateRolePermission,
    currentUserRole,
    setCurrentUserRole,
    branding,
    updateBranding,
    resetBranding,
  } = useGymData();

  const [activeTab, setActiveTab] = useState('branding'); // default to branding so user can see it right away!
  const [gymName, setGymName] = useState(branding?.gymName || 'FitLife');
  const [tagline, setTagline] = useState(branding?.tagline || 'ENTERPRISE GYM');
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || '');
  const [logoIcon, setLogoIcon] = useState(branding?.logoIcon || 'Flame');
  const [heroTagline, setHeroTagline] = useState(branding?.heroTagline || 'TRAIN HARD.\nLIVE STRONG.');
  const [heroSub, setHeroSub] = useState(branding?.heroSub || 'YOUR FITNESS.\nYOUR JOURNEY.');
  const [phone, setPhone] = useState(branding?.phone || '+880 1711-223344');
  const [email, setEmail] = useState(branding?.email || 'contact@fitlife.com');
  const [address, setAddress] = useState(branding?.address || 'Plot 42, Gulshan Avenue, Dhaka, Bangladesh');

  const [savedSuccess, setSavedSuccess] = useState(false);

  const iconOptions = [
    { id: 'Flame', label: 'Flame', icon: Flame },
    { id: 'Dumbbell', label: 'Dumbbell', icon: Dumbbell },
    { id: 'Award', label: 'Award Badge', icon: Award },
    { id: 'Shield', label: 'Shield', icon: ShieldCheck },
    { id: 'Zap', label: 'Lightning Zap', icon: Zap },
    { id: 'Activity', label: 'Pulse Activity', icon: Activity },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = (e) => {
    e.preventDefault();
    updateBranding({
      gymName: gymName.trim() || 'FitLife',
      tagline: tagline.trim() || 'ENTERPRISE GYM',
      logoUrl,
      logoIcon,
      heroTagline,
      heroSub,
      phone,
      email,
      address,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleReset = () => {
    if (window.confirm('Reset branding back to default FitLife values?')) {
      resetBranding();
      setGymName('FitLife');
      setTagline('ENTERPRISE GYM');
      setLogoUrl('');
      setLogoIcon('Flame');
      setHeroTagline('TRAIN HARD.\nLIVE STRONG.');
      setHeroSub('YOUR FITNESS.\nYOUR JOURNEY.');
      setPhone('+880 1711-223344');
      setEmail('contact@fitlife.com');
      setAddress('Plot 42, Gulshan Avenue, Dhaka, Bangladesh');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const renderPreviewLogo = () => {
    if (logoUrl) {
      return (
        <img
          src={logoUrl}
          alt={gymName}
          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }}
        />
      );
    }
    const SelectedIcon = iconOptions.find((i) => i.id === logoIcon)?.icon || Flame;
    return <SelectedIcon size={22} />;
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">System Settings & Brand Management</h1>
          <p className="page-subtitle">
            Configure gym identity, customize logo & name, and manage role-based discount authority (RBAC).
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="subtabs-bar">
          <button
            className={`subtab-btn ${activeTab === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveTab('branding')}
          >
            <Building2 size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Brand & Logo Identity
          </button>
          <button
            className={`subtab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <ShieldCheck size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Role Privileges & Access Matrix
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div
          className="badge badge-success"
          style={{
            padding: '12px 18px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: 'var(--radius-md)',
            animation: 'pageFadeSlideIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <strong>Brand settings saved successfully!</strong> Updates are now live throughout the entire application.
        </div>
      )}

      {/* =========================================================================
          TAB 1: BRAND IDENTITY & LOGO SETTINGS
          ========================================================================= */}
      {activeTab === 'branding' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Form */}
          <div className="activity-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Gym Identity & Logo Customizer</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Change the name, slogan and logo shown on the sidebar, login screen and reports.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBranding} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Gym / Business Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    placeholder="e.g. FitLife or Iron Gym"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tagline / Sub-Heading</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="e.g. ENTERPRISE GYM"
                  />
                </div>
              </div>

              {/* Logo Selection Mode */}
              <div className="form-group">
                <label className="form-label">Select Brand Icon (Default Vector)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {iconOptions.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = logoIcon === opt.id && !logoUrl;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setLogoIcon(opt.id);
                          setLogoUrl(''); // Clear custom URL to use vector icon
                        }}
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp size={18} />
                        <span style={{ fontSize: '12px' }}>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Logo Image URL or File Upload */}
              <div className="form-group">
                <label className="form-label">Custom Logo Image (URL or Upload)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/your-logo.png"
                    style={{ flex: 1 }}
                  />
                  <label
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Upload size={14} /> Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Paste any image link or upload directly from your computer (.PNG, .JPG, .SVG).
                </span>
              </div>

              {/* Taglines on Login Page */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Login Hero Tagline</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={heroTagline}
                    onChange={(e) => setHeroTagline(e.target.value)}
                    placeholder="TRAIN HARD.&#10;LIVE STRONG."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Login Sub-Tagline</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={heroSub}
                    onChange={(e) => setHeroSub(e.target.value)}
                    placeholder="YOUR FITNESS.&#10;YOUR JOURNEY."
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gym Physical Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                  <Check size={16} /> Save Brand Settings
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  title="Reset to default FitLife branding"
                >
                  <RotateCcw size={16} /> Reset Defaults
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="activity-card" style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Live Sidebar Preview
              </span>

              <div
                style={{
                  marginTop: '14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-base)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary)',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    boxShadow: '0 0 15px var(--primary-glow)',
                    overflow: 'hidden',
                    padding: logoUrl ? '4px' : '0',
                  }}
                >
                  {renderPreviewLogo()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: "'Anton', 'Montserrat', sans-serif", fontSize: '22px', letterSpacing: '1.5px', lineHeight: 1 }}>
                    {gymName || 'FITLIFE'}
                  </span>
                  <span style={{ fontSize: '10px', letterSpacing: '1.5px', color: 'var(--primary)', fontWeight: 800, marginTop: '2px' }}>
                    {tagline || 'ENTERPRISE GYM'}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '14px' }}>
                This is how your brand header appears on the top-left sidebar across all pages.
              </p>
            </div>

            {/* Live Login Screen Preview Card */}
            <div className="activity-card" style={{ padding: '24px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Live Login Screen Hero Preview
              </span>

              <div
                style={{
                  marginTop: '14px',
                  background: 'linear-gradient(135deg, #101014 0%, #1e1b4b 70%, #0f172a 100%)',
                  border: '1px solid var(--border-base)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ width: '38px', height: '38px', color: 'var(--primary)' }}>
                  {renderPreviewLogo()}
                </div>
                <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: 'var(--primary)', letterSpacing: '2px', margin: 0 }}>
                  {gymName || 'FITLIFE'}
                </h1>
                <p style={{ fontSize: '15px', fontWeight: 800, whiteSpace: 'pre-line', margin: 0 }}>
                  {heroTagline || 'TRAIN HARD.\nLIVE STRONG.'}
                </p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-line', margin: 0 }}>
                  {heroSub || 'YOUR FITNESS.\nYOUR JOURNEY.'}
                </p>
              </div>

              <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Phone:</strong> {phone}</div>
                <div><strong>Email:</strong> {email}</div>
                <div><strong>Address:</strong> {address}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ROLE PERMISSION & ACCESS MATRIX (RBAC)
          ========================================================================= */}
      {activeTab === 'roles' && (
        <>
          {/* Active Role Simulation Switcher */}
          <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} color="var(--primary)" />
              <div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)' }}>CURRENT SIMULATED USER ROLE:</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>{currentUserRole}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {roles.map((r) => (
                <button
                  key={r.id}
                  className={`btn btn-sm ${currentUserRole === r.name ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCurrentUserRole(r.name)}
                >
                  Simulate: {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Roles & Permissions Matrix */}
          <div className="activity-card">
            <div className="activity-header">
              <span style={{ fontWeight: 800 }}>Role Permission & Dynamic Discount Authority Matrix</span>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Role & Description</th>
                    <th>Discount Privilege</th>
                    <th>Max Discount %</th>
                    <th>Approve Members</th>
                    <th>Manage Lockers</th>
                    <th>Financials</th>
                    <th>Staff Count</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                            {role.name}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {role.description}
                          </span>
                        </div>
                      </td>

                      {/* Can Apply Discount Toggle */}
                      <td>
                        <button
                          className={`btn btn-sm ${role.canApplyDiscount ? 'btn-primary' : 'btn-danger'}`}
                          onClick={() => updateRolePermission(role.id, 'canApplyDiscount', !role.canApplyDiscount)}
                          title="Toggle discount privilege"
                        >
                          {role.canApplyDiscount ? '✓ Allowed' : '✗ Denied'}
                        </button>
                      </td>

                      {/* Max Discount % Input */}
                      <td>
                        {role.canApplyDiscount ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              style={{ width: '65px', padding: '4px 6px', fontSize: '12px' }}
                              className="form-input"
                              value={role.maxDiscountPercent}
                              onChange={(e) => updateRolePermission(role.id, 'maxDiscountPercent', Number(e.target.value))}
                            />
                            <span style={{ fontWeight: 700, fontSize: '12px' }}>%</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>0% (Locked)</span>
                        )}
                      </td>

                      {/* Can Approve Members */}
                      <td>
                        <button
                          className={`btn btn-sm ${role.canApproveMembers ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => updateRolePermission(role.id, 'canApproveMembers', !role.canApproveMembers)}
                        >
                          {role.canApproveMembers ? '✓ Yes' : '✗ No'}
                        </button>
                      </td>

                      {/* Can Manage Lockers */}
                      <td>
                        <button
                          className={`btn btn-sm ${role.canManageLockers ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => updateRolePermission(role.id, 'canManageLockers', !role.canManageLockers)}
                        >
                          {role.canManageLockers ? '✓ Yes' : '✗ No'}
                        </button>
                      </td>

                      {/* Financials */}
                      <td>
                        <button
                          className={`btn btn-sm ${role.canManageFinances ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => updateRolePermission(role.id, 'canManageFinances', !role.canManageFinances)}
                        >
                          {role.canManageFinances ? '✓ Full' : '✗ View Only'}
                        </button>
                      </td>

                      <td style={{ fontWeight: 700 }}>{role.usersCount} Users</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
