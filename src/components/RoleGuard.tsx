import type { ReactNode } from 'react'
import type { Role } from '../types'
import { useAuth } from '../contexts/AuthContext'

interface RoleGuardProps {
  allowedRoles: Role[]
  children: ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-green-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">无权限</p>
          <p className="text-sm text-gray-400 mt-2">您没有访问此页面的权限</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
