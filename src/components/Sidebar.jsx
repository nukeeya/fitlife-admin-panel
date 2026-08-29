import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Dumbbell,
  Award,
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
    <div className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-text">FITLIFE</span>
        <span className="logo-sub">GYM MANAGEMENT</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
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
