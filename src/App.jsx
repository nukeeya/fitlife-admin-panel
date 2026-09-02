import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetails from './pages/MemberDetails';
import ApprovalManagement from './pages/ApprovalManagement';
import LockerManagement from './pages/LockerManagement';
import Trainers from './pages/Trainers';
import Employees from './pages/Employees';
import Accounts from './pages/Accounts';
import Attendance from './pages/Attendance';
import SMSManagement from './pages/SMSManagement';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Advertisements from './pages/Advertisements';
import AIWorkoutManagement from './pages/AIWorkoutManagement';
import DietPlans from './pages/DietPlans';
import Employees from './pages/Employees';

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetails />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/memberships" element={<Memberships />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/diet-plans" element={<DietPlans />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}
