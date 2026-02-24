import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'

interface Props {
  role?: 'CLIENT' | 'ADMIN'
}

export default function ProtectedRoute({ role }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to='/login' replace />
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/client'} replace />
  }

  return <Outlet />
}
