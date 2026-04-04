import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  TreePine,
  MapPin,
  FolderKanban,
  FileText,
  ClipboardList,
  Flag,
  Wrench,
  Database,
  MessageCircle,
} from 'lucide-react'
import NotificationPanel from './NotificationPanel'

interface NavGroup {
  label: string
  items: { to: string; icon: typeof LayoutDashboard; label: string }[]
}

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isStudent = user?.role === 'student'

  const navGroups: NavGroup[] = [
    {
      label: '总览',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
      ],
    },
    ...(!isStudent ? [{
      label: '人员',
      items: [
        { to: '/students', icon: Users, label: '学生管理' },
      ],
    }] : []),
    {
      label: '科研',
      items: [
        { to: '/projects', icon: FolderKanban, label: '研究进展' },
        { to: '/papers', icon: FileText, label: '论文管理' },
      ],
    },
    ...(!isStudent ? [{
      label: '野外',
      items: [
        { to: '/sites', icon: MapPin, label: '站点管理' },
        { to: '/field-data', icon: Database, label: '数据采集' },
      ],
    }] : []),
    {
      label: '管理',
      items: [
        { to: '/reports', icon: ClipboardList, label: '周报' },
        { to: '/milestones', icon: Flag, label: '毕业节点' },
        { to: '/reservations', icon: Wrench, label: '仪器预约' },
        { to: '/questions', icon: MessageCircle, label: '提问答疑' },
      ],
    },
  ]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm ${
      isActive
        ? 'bg-white/15 text-white font-semibold rounded-lg border-l-2 border-green-400'
        : 'text-green-200/80 hover:bg-white/10 hover:text-white rounded-lg'
    }`

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-[#132d22]`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
            <TreePine
              className="w-8 h-8 text-green-300"
              style={{ filter: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.45))' }}
            />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">PWRLab</h1>
              <p className="text-green-300 text-xs">学生管理系统</p>
            </div>
            <button
              className="ml-auto lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-4 mb-1 uppercase font-medium text-green-400/50 text-[10px] tracking-[0.15em]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={linkClass}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User info & sign out */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="bg-black/20 rounded-xl px-3 py-3 mx-1">
              <div className="text-green-200 text-sm mb-2 truncate">
                {user?.name} ({user?.role === 'admin' ? '导师' : '学生'})
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-green-300 hover:text-white transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between lg:px-6">
          <div className="flex items-center">
            <button
              className="lg:hidden mr-3 p-2 rounded-md hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-base font-semibold text-gray-700 tracking-wide">
              人工林水分关系实验室
            </h2>
          </div>
          <NotificationPanel />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
