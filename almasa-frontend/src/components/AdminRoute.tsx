import { Navigate } from 'react-router-dom';
import { getAuth, isAdmin } from '@/lib/auth';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  if (!auth?.token) return <Navigate to="/login" replace />;
  if (!isAdmin(auth)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
