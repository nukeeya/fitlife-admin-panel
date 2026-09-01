import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useGymData } from '../context/GymDataContext';

export default function Sidebar() {
  const location = useLocation();
  const { applications } = useGymData();
  const pendingAppsCount = applications.filter((a) => a.status === 'Pending').length;

  // Submenu toggle states
  const [openMenus, setOpenMenus] = useState({
    lockers: location.pathname.startsWith('/lockers'),
    accounts: location.pathname.startsWith('/accounts'),
    attendance: location.pathname.startsWith('/attendance'),
    plans: location.pathname.startsWith('/subscription-plans'),
  });

  const toggleSubmenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
            <div className="sidebar-link-content">
              <CreditCard size={18} />
              <span>Accounts</span>
            </div>
            {openMenus.accounts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openMenus.accounts && (
            <div className="sidebar-submenu">
              <NavLink to="/accounts?tab=invoices" className="submenu-link">
                • Invoice List
              </NavLink>
              <NavLink to="/accounts?tab=payments" className="submenu-link">
                • Payment Collection
              </NavLink>
              <NavLink to="/accounts?tab=expenses" className="submenu-link">
                • Expense Management
              </NavLink>
              <NavLink to="/accounts?tab=balance-sheet" className="submenu-link">
                • Monthly Balance Sheet
              </NavLink>
            </div>
          )}
        </div>

        {/* 8. Attendance (Submenus) */}
        <div>
          <button
            type="button"
            className={`sidebar-link ${location.pathname.startsWith('/attendance') ? 'active' : ''}`}
            onClick={() => toggleSubmenu('attendance')}
          >
            <div className="sidebar-link-content">
              <CalendarCheck size={18} />
              <span>Attendance</span>
            </div>
            {openMenus.attendance ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openMenus.attendance && (
            <div className="sidebar-submenu">
              <NavLink to="/attendance?tab=daily-present" className="submenu-link">
                • Daily Present Attendance
              </NavLink>
              <NavLink to="/attendance?tab=daily-absent" className="submenu-link">
                • Daily Absent Attendance
              </NavLink>
              <NavLink to="/attendance?tab=summary" className="submenu-link">
                • Summary Attendance
              </NavLink>
              <NavLink to="/attendance?tab=individual" className="submenu-link">
                • Individual Attendance
              </NavLink>
              <NavLink to="/attendance?tab=multiple" className="submenu-link">
                • Multiple Attendance (Bulk)
              </NavLink>
            </div>
          )}
        </div>

        {/* 9. SMS Management */}
        <NavLink
          to="/sms"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <MessageSquare size={18} />
            <span>SMS Management</span>
          </div>
        </NavLink>

        <span className="nav-section-title">Growth & Automation</span>

        {/* 10. Subscription Plans (Submenus) */}
        <div>
          <button
            type="button"
            className={`sidebar-link ${location.pathname.startsWith('/subscription-plans') ? 'active' : ''}`}
            onClick={() => toggleSubmenu('plans')}
          >
            <div className="sidebar-link-content">
              <Award size={18} />
              <span>Subscription Plans</span>
            </div>
            {openMenus.plans ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openMenus.plans && (
            <div className="sidebar-submenu">
              <NavLink to="/subscription-plans?tab=plans" className="submenu-link">
                • Subscription Plan List
              </NavLink>
              <NavLink to="/subscription-plans?tab=features" className="submenu-link">
                • Subscription Feature List
              </NavLink>
              <NavLink to="/subscription-plans?tab=lockers" className="submenu-link">
                • Subscription Locker List
              </NavLink>
            </div>
          )}
        </div>

        {/* 11. Advertisements */}
        <NavLink
          to="/advertisements"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Megaphone size={18} />
            <span>Advertisements</span>
          </div>
        </NavLink>

        {/* 12. AI Workout Management */}
        <NavLink
          to="/ai-workouts"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Cpu size={18} />
            <span>AI Workout Management</span>
          </div>
        </NavLink>

        {/* 13. AI Diet Plan */}
        <NavLink
          to="/diet-plans"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <Apple size={18} />
            <span>AI Diet Plan</span>
          </div>
        </NavLink>

        {/* 14. Job Posting */}
        <NavLink
          to="/job-postings"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <FileSpreadsheet size={18} />
            <span>Job Posting</span>
          </div>
        </NavLink>

        {/* 15. Reports */}
        <NavLink
          to="/reports"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <BarChart3 size={18} />
            <span>Reports & Analytics</span>
          </div>
        </NavLink>

        {/* 16. System Management */}
        <NavLink
          to="/system-roles"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-link-content">
            <ShieldCheck size={18} />
            <span>System Management</span>
          </div>
        </NavLink>
      </nav>
    </aside>
  );
}
