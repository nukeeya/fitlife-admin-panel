import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GymDataProvider } from './context/GymDataContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetails from './pages/MemberDetails';
import ApprovalManagement from './pages/ApprovalManagement';
import Admissions from './pages/Admissions';
import LockerManagement from './pages/LockerManagement';
import Trainers from './pages/Trainers';
import Employees from './pages/Employees';
import Accounts from './pages/Accounts';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Memberships from './pages/Memberships';
import SMSManagement from './pages/SMSManagement';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Advertisements from './pages/Advertisements';
import AIWorkoutManagement from './pages/AIWorkoutManagement';
import DietPlans from './pages/DietPlans';
import JobPosting from './pages/JobPosting';
import Reports from './pages/Reports';
import SystemManagement from './pages/SystemManagement';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <GymDataProvider>
            <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/members" element={<Members />} />
              <Route path="/members/:id" element={<MemberDetails />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/approvals" element={<ApprovalManagement />} />
              <Route path="/lockers" element={<LockerManagement />} />
              <Route path="/trainers" element={<Trainers />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/memberships" element={<Memberships />} />
              <Route path="/sms" element={<SMSManagement />} />
              <Route path="/subscription-plans" element={<SubscriptionPlans />} />
              <Route path="/advertisements" element={<Advertisements />} />
              <Route path="/ai-workouts" element={<AIWorkoutManagement />} />
              <Route path="/diet-plans" element={<DietPlans />} />
              <Route path="/job-postings" element={<JobPosting />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/system" element={<SystemManagement />} />
              <Route path="/system-roles" element={<SystemManagement />} />
            </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </GymDataProvider>
    </ThemeProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
