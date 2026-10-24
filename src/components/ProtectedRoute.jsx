import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, staff, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Signed in, but not an active staff account with a role. The database
  // refuses every query for such accounts, so don't render an empty app.
  if (!staff) {
    return (
      <div className="loading-screen">
        <h2>Access pending</h2>
        <p>
          {user.email} is signed in, but no active staff role is assigned to this account.
          Ask a Super Admin to assign you a role in System Management.
        </p>
        <button type="button" className="btn btn-primary" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  return <Outlet />;
}
