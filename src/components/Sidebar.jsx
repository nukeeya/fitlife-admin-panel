import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Key,
  Dumbbell,
  Briefcase,
  CreditCard,
  CalendarCheck,
  MessageSquare,
  Award,
  Megaphone,
  Cpu,
  Apple,
  FileSpreadsheet,
  BarChart3,
  Settings,
  Apple,
  Briefcase,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { path: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { path: '/members', label: 'MEMBERS', icon: Users },
  { path: '/attendance', label: 'ATTENDANCE', icon: CalendarCheck },
  { path: '/memberships', label: 'MEMBERSHIPS', icon: Award },
  { path: '/payments', label: 'PAYMENTS', icon: CreditCard },
  { path: '/trainers', label: 'TRAINERS', icon: Dumbbell },
  { path: '/employees', label: 'EMPLOYEES', icon: Briefcase },
  { path: '/reports', label: 'REPORTS', icon: BarChart3 },
  { path: '/diet-plans', label: 'DIET PLANS', icon: Apple },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="logo-badge">
          <Flame size={20} />
        </div>
        <div className="logo-text-group">
          <span className="logo-text">FITLIFE</span>
          <span className="logo-sub">ENTERPRISE GYM</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <span className="nav-section-title">Core Operations</span>

        {/* 1. Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </div>
        </NavLink>

        {/* 2. Member Management */}
        <NavLink
          to="/members"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Users size={18} />
            <span>Member Management</span>
          </div>
        </NavLink>

        {/* 3. Approval Management */}
        <NavLink
          to="/approvals"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <UserCheck size={18} />
            <span>Approval Management</span>
          </div>
          {pendingAppsCount > 0 && (
            <span className="nav-badge-pending">{pendingAppsCount}</span>
          )}
        </NavLink>

        {/* 4. Locker Management (Submenus) */}
        <div>
          <button
            type="button"
            className={`sidebar-link ${location.pathname.startsWith('/lockers') ? 'active' : ''}`}
            onClick={() => toggleSubmenu('lockers')}
          >
            <div className="sidebar-link-content">
              <Key size={18} />
              <span>Locker Management</span>
            </div>
            {openMenus.lockers ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openMenus.lockers && (
            <div className="sidebar-submenu">
              <NavLink to="/lockers?tab=assigned" className="submenu-link">
                • Assigned Locker
              </NavLink>
              <NavLink to="/lockers?tab=edit-list" className="submenu-link">
                • Locker Edit List
              </NavLink>
            </div>
          )}
        </div>

        {/* 5. Trainer Management */}
        <NavLink
          to="/trainers"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Dumbbell size={18} />
            <span>Trainer Management</span>
          </div>
        </NavLink>

        {/* 6. Employee Management */}
        <NavLink
          to="/employees"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Briefcase size={18} />
            <span>Employee Management</span>
          </div>
        </NavLink>

        <span className="nav-section-title">Finance & Attendance</span>

        {/* 7. Accounts (Submenus) */}
        <div>
          <button
            type="button"
            className={`sidebar-link ${location.pathname.startsWith('/accounts') ? 'active' : ''}`}
            onClick={() => toggleSubmenu('accounts')}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'LIGHT MODE' : 'NIGHT MODE'}</span>
        </button>
        <button className="sidebar-link settings-btn">
          <Settings size={18} />
          <span>SETTINGS</span>
        </button>
      </div>
    </div>
  );
}
