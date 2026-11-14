import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
