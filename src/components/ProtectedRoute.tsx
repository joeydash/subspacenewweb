import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import BlockedUserPage from '../pages/BlockedUserPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const isBlocked = user?.isBlocked;

  if (!isAuthenticated) {
    // Store the full path including search params for redirect after login
    const currentPath = location.pathname + location.search;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  if (isBlocked) {
    return <Navigate to='/blocked' replace/>
  }

  return <>{children}</>;
}

export default ProtectedRoute;