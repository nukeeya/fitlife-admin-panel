import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetails from './pages/MemberDetails';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Trainers from './pages/Trainers';
import Memberships from './pages/Memberships';
import Reports from './pages/Reports';
import DietPlans from './pages/DietPlans';
import Employees from './pages/Employees';
import Admissions from './pages/Admissions';

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
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
            <Route path="/admissions" element={<Admissions />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
