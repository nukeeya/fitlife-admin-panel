import { useState } from 'react';
import {
  Search,
  Sliders,
  Sun,
  Moon,
  UserCheck,
  Bell,
  LogOut,
  Menu,
  Plus,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import ConfirmDialog from './common/ConfirmDialog';
import { downloadBackup, hasBusinessData } from '../utils/localBackup';

export default function Header({ onOpenQuickCheckIn, onOpenAdmission, onToggleSidebar }) {
  const { theme, toggleTheme, setIsCustomizerOpen } = useTheme();
  const { user, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const emailLocal = (user?.email || '').split('@')[0];
  const displayName = emailLocal
    ? emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1)
    : 'Signed out';
  const initials = emailLocal ? emailLocal.slice(0, 2).toUpperCase() : '?';

  const finishSignOut = async (withBackup) => {
    setIsSigningOut(true);
    try {
      if (withBackup) downloadBackup();
      await signOut();
    } finally {
      setIsSigningOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleLogoutClick = () => {
    if (hasBusinessData()) {
      setShowLogoutConfirm(true);
    } else {
      finishSignOut(false);
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {/* Mobile: opens the off-canvas sidebar drawer */}
        <button
          className="header-icon-btn menu-toggle"
          onClick={onToggleSidebar}
          title="Open navigation menu"
        >
          <Menu size={18} />
        </button>

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
          <Plus size={14} />
          <span className="btn-label">New Admission</span>
        </button>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onOpenQuickCheckIn}
          title="Quick Member Check-In"
        >
          <UserCheck size={14} />
          <span className="btn-label">Quick Check-In</span>
        </button>
      </div>

      <div className="header-right">
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
        <div className="user-profile-pill" title={user?.email || 'Not signed in'}>
          <div className="user-avatar">{initials}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>{displayName}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {user?.email || 'Not signed in'}
            </span>
          </div>
        </div>

        {/* Sign Out — exports browser-local data before it is wiped */}
        <button
          className="header-icon-btn"
          onClick={handleLogoutClick}
          disabled={isSigningOut}
          title="Sign out (downloads a backup of this device's data first)"
        >
          <LogOut size={18} />
        </button>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => finishSignOut(true)}
        title="Sign out?"
        message={
          <>
            A JSON backup of this browser&apos;s FitLife data (members, invoices,
            attendance and the rest) will download first, then it will be erased
            from this device.
          </>
        }
        confirmText="Download backup & sign out"
        cancelText="Cancel"
        type="warning"
        isLoading={isSigningOut}
      />
    </header>
  );
}
