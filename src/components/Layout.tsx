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
    <div className="flex h-screen" style={{ backgroundColor: '#f5f3ef' }}>
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
        }`}
        style={{ background: 'linear-gradient(180deg, #0f2a1c 0%, #1a3a2a 50%, #0d2417 100%)' }}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative background trees */}
          <svg className="absolute bottom-0 left-0 right-0 w-full opacity-[0.06] pointer-events-none" viewBox="0 0 256 120" preserveAspectRatio="xMidYMax meet">
            <polygon points="60,120 80,70 100,120" fill="white"/>
            <polygon points="55,100 80,50 105,100" fill="white"/>
            <polygon points="50,110 80,35 110,110" fill="white"/>
            <rect x="77" y="110" width="6" height="10" fill="white"/>
            <polygon points="140,120 158,78 176,120" fill="white"/>
            <polygon points="136,104 158,62 180,104" fill="white"/>
            <polygon points="132,115 158,48 184,115" fill="white"/>
            <rect x="155" y="110" width="6" height="10" fill="white"/>
            <polygon points="195,120 210,85 225,120" fill="white"/>
            <polygon points="192,108 210,72 228,108" fill="white"/>
            <rect x="207" y="110" width="6" height="10" fill="white"/>
          </svg>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.08]">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              <TreePine className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight tracking-wide">PWRLab</h1>
              <p className="text-green-400/50 text-[10px] tracking-[0.15em] uppercase">学生管理系统</p>
            </div>
            <button
              className="ml-auto lg:hidden text-white/60 hover:text-white p-1"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1.5 uppercase font-semibold text-green-400/30 text-[9px] tracking-[0.22em]">
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
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User info & sign out */}
          <div className="relative z-10 px-3 py-4 border-t border-white/[0.08]">
            <div className="rounded-xl px-3 py-3" style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a3a2a, #4da37c)' }}
                >
                  {user?.name?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-green-100 text-xs font-medium truncate">{user?.name}</p>
                  <p className="text-green-400/40 text-[10px]">{user?.role === 'admin' ? '导师' : '学生'}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-green-400/50 hover:text-green-300 transition-colors text-xs w-full"
              >
                <LogOut className="w-3.5 h-3.5" />
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
