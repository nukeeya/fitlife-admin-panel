import { useState } from 'react';
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
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HorizontalNav() {
  const { navStyle } = useTheme();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const handleDropdownClick = (name) => {
    if (navStyle === 'horizontal-click') {
      setActiveDropdown(activeDropdown === name ? null : name);
    }
  };

  return (
    <nav className="horizontal-nav-bar">
      <NavLink to="/dashboard" className="h-nav-link">
        <LayoutDashboard size={16} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/members" className="h-nav-link">
        <Users size={16} />
        <span>Members</span>
      </NavLink>

      <NavLink to="/approvals" className="h-nav-link">
        <UserCheck size={16} />
        <span>Approvals</span>
      </NavLink>

      {/* Lockers Dropdown */}
      <div className="h-nav-item">
        <div
          className="h-nav-link"
          onClick={() => handleDropdownClick('lockers')}
        >
          <Key size={16} />
          <span>Lockers</span>
          <ChevronDown size={12} />
        </div>
        {(activeDropdown === 'lockers' || navStyle === 'horizontal-hover') && (
          <div className="h-nav-dropdown" style={{ display: navStyle === 'horizontal-click' ? (activeDropdown === 'lockers' ? 'flex' : 'none') : undefined }}>
            <NavLink to="/lockers?tab=assigned" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Assigned Locker
            </NavLink>
            <NavLink to="/lockers?tab=edit-list" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Locker Edit List
            </NavLink>
          </div>
        )}
      </div>

      <NavLink to="/trainers" className="h-nav-link">
        <Dumbbell size={16} />
        <span>Trainers</span>
      </NavLink>

      <NavLink to="/employees" className="h-nav-link">
        <Briefcase size={16} />
        <span>Employees</span>
      </NavLink>

      {/* Accounts Dropdown */}
      <div className="h-nav-item">
        <div
          className="h-nav-link"
          onClick={() => handleDropdownClick('accounts')}
        >
          <CreditCard size={16} />
          <span>Accounts</span>
          <ChevronDown size={12} />
        </div>
        {(activeDropdown === 'accounts' || navStyle === 'horizontal-hover') && (
          <div className="h-nav-dropdown" style={{ display: navStyle === 'horizontal-click' ? (activeDropdown === 'accounts' ? 'flex' : 'none') : undefined }}>
            <NavLink to="/accounts?tab=invoices" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Invoice List
            </NavLink>
            <NavLink to="/accounts?tab=payments" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Payment Collection
            </NavLink>
            <NavLink to="/accounts?tab=expenses" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Expense Management
            </NavLink>
            <NavLink to="/accounts?tab=balance-sheet" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Monthly Balance Sheet
            </NavLink>
          </div>
        )}
      </div>

      {/* Attendance Dropdown */}
      <div className="h-nav-item">
        <div
          className="h-nav-link"
          onClick={() => handleDropdownClick('attendance')}
        >
          <CalendarCheck size={16} />
          <span>Attendance</span>
          <ChevronDown size={12} />
        </div>
        {(activeDropdown === 'attendance' || navStyle === 'horizontal-hover') && (
          <div className="h-nav-dropdown" style={{ display: navStyle === 'horizontal-click' ? (activeDropdown === 'attendance' ? 'flex' : 'none') : undefined }}>
            <NavLink to="/attendance?tab=daily-present" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Daily Present Attendance
            </NavLink>
            <NavLink to="/attendance?tab=daily-absent" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Daily Absent Attendance
            </NavLink>
            <NavLink to="/attendance?tab=summary" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Summary Attendance
            </NavLink>
            <NavLink to="/attendance?tab=individual" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Individual Attendance
            </NavLink>
            <NavLink to="/attendance?tab=multiple" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Multiple Attendance (Bulk)
            </NavLink>
          </div>
        )}
      </div>

      <NavLink to="/sms" className="h-nav-link">
        <MessageSquare size={16} />
        <span>SMS</span>
      </NavLink>

      {/* Plans Dropdown */}
      <div className="h-nav-item">
        <div
          className="h-nav-link"
          onClick={() => handleDropdownClick('plans')}
        >
          <Award size={16} />
          <span>Plans</span>
          <ChevronDown size={12} />
        </div>
        {(activeDropdown === 'plans' || navStyle === 'horizontal-hover') && (
          <div className="h-nav-dropdown" style={{ display: navStyle === 'horizontal-click' ? (activeDropdown === 'plans' ? 'flex' : 'none') : undefined }}>
            <NavLink to="/subscription-plans?tab=plans" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Plan List
            </NavLink>
            <NavLink to="/subscription-plans?tab=features" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Feature List
            </NavLink>
            <NavLink to="/subscription-plans?tab=lockers" className="submenu-link" onClick={() => setActiveDropdown(null)}>
              Locker List
            </NavLink>
          </div>
        )}
      </div>

      <NavLink to="/advertisements" className="h-nav-link">
        <Megaphone size={16} />
        <span>Ads</span>
      </NavLink>

      <NavLink to="/ai-workouts" className="h-nav-link">
        <Cpu size={16} />
        <span>AI Workout</span>
      </NavLink>

      <NavLink to="/diet-plans" className="h-nav-link">
        <Apple size={16} />
        <span>AI Diet</span>
      </NavLink>

      <NavLink to="/job-postings" className="h-nav-link">
        <FileSpreadsheet size={16} />
        <span>Jobs</span>
      </NavLink>

      <NavLink to="/reports" className="h-nav-link">
        <BarChart3 size={16} />
        <span>Reports</span>
      </NavLink>

      <NavLink to="/system-roles" className="h-nav-link">
        <ShieldCheck size={16} />
        <span>Roles</span>
      </NavLink>
    </nav>
  );
}
