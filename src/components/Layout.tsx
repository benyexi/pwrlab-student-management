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
        <header className="backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between lg:px-6" style={{ backgroundColor: 'rgba(13,31,20,0.97)', borderBottomColor: 'rgba(74,222,128,0.12)' }}>
          <div className="flex items-center">
            <button
              className="lg:hidden mr-3 p-2 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6 text-green-300/70" />
            </button>
            <h2 className="text-base font-semibold tracking-wide" style={{ color: 'rgba(187,232,200,0.85)' }}>
              人工林水分关系实验室
            </h2>
          </div>
          <NotificationPanel />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative" style={{
          background: 'linear-gradient(170deg, #0d1f14 0%, #111f16 45%, #0c1b10 100%)'
        }}>
          {/* Topographic contour lines — green on dark */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            style={{ opacity: 0.13 }}
          >
            <defs>
              <pattern id="topo" x="0" y="0" width="520" height="360" patternUnits="userSpaceOnUse">
                <path d="M-40,180 C60,120 160,200 260,150 C360,100 420,170 560,140" stroke="#4ade80" strokeWidth="1.1" fill="none"/>
                <path d="M-40,210 C50,155 150,235 260,185 C370,135 430,205 560,175" stroke="#4ade80" strokeWidth="0.8" fill="none"/>
                <path d="M-40,238 C60,190 160,268 260,218 C360,168 430,238 560,206" stroke="#4ade80" strokeWidth="0.6" fill="none"/>
                <path d="M-40,80 C80,38 180,108 300,63 C400,23 460,78 560,52" stroke="#4ade80" strokeWidth="1.0" fill="none"/>
                <path d="M-40,106 C80,66 180,136 300,92 C400,52 460,106 560,80" stroke="#4ade80" strokeWidth="0.7" fill="none"/>
                <path d="M-40,290 C70,250 170,318 280,276 C390,233 450,293 560,266" stroke="#4ade80" strokeWidth="0.8" fill="none"/>
                <path d="M-40,316 C70,278 170,346 280,306 C390,263 450,323 560,296" stroke="#4ade80" strokeWidth="0.5" fill="none"/>
                <line x1="130" y1="116" x2="130" y2="127" stroke="#4ade80" strokeWidth="0.8"/>
                <line x1="310" y1="86" x2="310" y2="97" stroke="#4ade80" strokeWidth="0.8"/>
                <line x1="240" y1="156" x2="240" y2="167" stroke="#4ade80" strokeWidth="0.8"/>
                <line x1="420" y1="196" x2="420" y2="207" stroke="#4ade80" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#topo)"/>
          </svg>
          {/* Depth glows */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: `
              radial-gradient(ellipse 100% 55% at 50% -5%, rgba(45,106,79,0.30) 0%, transparent 62%),
              radial-gradient(ellipse 50% 60% at 100% 100%, rgba(10,30,18,0.6) 0%, transparent 50%),
              radial-gradient(ellipse 45% 50% at 0% 100%, rgba(10,28,16,0.5) 0%, transparent 50%)
            `
          }} />
          <div className="relative p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
