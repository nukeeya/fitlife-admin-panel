import { useState } from 'react';
import {
  Search,
  Sliders,
  Sun,
  Moon,
  MessageSquare,
  UserCheck,
  Bell,
  Shield,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useGymData } from '../context/GymDataContext';

export default function Header({ onOpenQuickCheckIn, onOpenAdmission }) {
  const { theme, toggleTheme, setIsCustomizerOpen } = useTheme();
  const { smsBalance, currentUserRole, setCurrentUserRole, roles } = useGymData();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-search">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search members, invoices, trainers..."
          />
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={onOpenAdmission}
          title="New Member Admission"
        >
          + New Admission
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenQuickCheckIn}
          title="Quick Member Check-In"
        >
          <UserCheck size={14} />
          Quick Check-In
        </button>
      </div>

      <div className="header-right">
        {/* SMS Balance Indicator */}
        <div className="badge-sms" title="Remaining SMS Campaign Credits">
          <MessageSquare size={14} />
          <span>{smsBalance.toLocaleString()} SMS</span>
        </div>

        {/* Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            className="badge-role"
            onClick={() => setShowRoleSelect(!showRoleSelect)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Switch User Role to test Role-Based Discount Privileges"
          >
            <Shield size={12} />
            {currentUserRole}
          </button>

          {showRoleSelect && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-base)',
                borderRadius: '8px',
                padding: '6px',
                minWidth: '180px',
                zIndex: 100,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, padding: '4px 8px', color: 'var(--text-muted)' }}>
                SWITCH ROLE (RBAC):
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    setCurrentUserRole(r.name);
                    setShowRoleSelect(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    fontSize: '12px',
                    fontWeight: r.name === currentUserRole ? 700 : 500,
                    color: r.name === currentUserRole ? 'var(--primary)' : 'var(--text-primary)',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {r.name} {r.canApplyDiscount ? '✓ Discount' : '✗ No Disc'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark/Light Theme Toggle */}
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="header-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="notif-dot"></span>
        </button>

        {/* UI Customizer Drawer Trigger */}
        <button
          className="header-icon-btn customizer-trigger"
          onClick={() => setIsCustomizerOpen(true)}
          title="Open UI & Theme Customizer"
        >
          <Sliders size={18} />
        </button>

        {/* User Pill */}
        <div className="user-profile-pill">
          <div className="user-avatar">AD</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>Admin Master</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dhaka Central</span>
          </div>
        </div>
      </div>
    </header>
  );
}
