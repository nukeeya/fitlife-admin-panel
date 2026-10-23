import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useFinance } from '../context/FinanceContext';
import ConfirmDialog from './common/ConfirmDialog';
import OverdueReminderModal from './finance/OverdueReminderModal';
import { downloadBackup, hasBusinessData } from '../utils/localBackup';

export default function Header({ onOpenQuickCheckIn, onOpenAdmission, onToggleSidebar }) {
  const { theme, toggleTheme, setIsCustomizerOpen } = useTheme();
  const { user, signOut } = useAuth();
  const { overdueCount, showOverduePopup, setShowOverduePopup } = useFinance();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
            placeholder="Search members, invoices, trainers... (Press Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                navigate(`/members?search=${encodeURIComponent(searchQuery.trim())}`);
              }
            }}
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

        {/* Overdue Dues Notifications */}
        <button
          className="header-icon-btn"
          onClick={() => setShowOverduePopup(true)}
          title={overdueCount > 0 ? `${overdueCount} Overdue Member Dues - Click to review alerts` : 'No overdue dues'}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {overdueCount > 0 ? (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--danger)',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '0 4px',
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              }}
            >
              {overdueCount}
            </span>
          ) : (
            <span className="notif-dot"></span>
          )}
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

      <OverdueReminderModal
        isOpen={showOverduePopup}
        onClose={() => setShowOverduePopup(false)}
      />
    </header>
  );
}
