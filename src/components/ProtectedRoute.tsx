import { Navigate } from 'react-router-dom'
import type { AuthUser } from '../types'

interface Props {
  user: AuthUser | null
  children: React.ReactNode
}

export default function ProtectedRoute({ user, children }: Props) {
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
