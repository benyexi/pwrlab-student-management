import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { document.title = '登录 | PWRlab' }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await signIn(email, password)
    if (authError) {
      setError(authError.message ?? '登录失败，请检查邮箱和密码')
      setLoading(false)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Ink Mountain Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden"
        style={{ background: '#060e08' }}
      >
        {/* Mountain layers — back to front */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 700"
          preserveAspectRatio="xMidYMax slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1 — distant, lightest */}
          <path
            d="M0,520 C80,480 150,440 230,420 C310,400 360,460 440,430 C520,400 570,370 640,380 C710,390 760,420 800,400 L800,700 L0,700 Z"
            fill="#0d2318" opacity="0.9"
          />
          {/* Layer 2 */}
          <path
            d="M0,560 C60,510 130,470 200,480 C270,490 310,530 390,500 C470,470 520,440 600,450 C680,460 740,490 800,470 L800,700 L0,700 Z"
            fill="#0a1c12" opacity="0.95"
          />
          {/* Layer 3 — mid, with tree silhouettes */}
          <path
            d="M0,590 C50,550 110,520 170,530 C220,538 250,560 310,545 C370,530 410,505 480,515 C550,525 600,548 660,535 C720,522 765,505 800,510 L800,700 L0,700 Z"
            fill="#071509"
          />
          {/* Tree tops on layer 3 */}
          {[30,70,110,150,190,240,290,340,390,445,500,555,610,660,715,760].map((x, i) => {
            const h = 18 + (i % 4) * 8
            const base = 530 + (i % 3) * 4
            return (
              <g key={x}>
                <polygon points={`${x},${base - h} ${x - 7},${base} ${x + 7},${base}`} fill="#050f07" />
                <polygon points={`${x},${base - h - 10} ${x - 5},${base - h + 5} ${x + 5},${base - h + 5}`} fill="#050f07" />
              </g>
            )
          })}
          {/* Layer 4 — foreground, darkest */}
          <path
            d="M0,630 C40,600 90,575 150,582 C200,588 230,610 280,600 C330,590 370,572 430,578 C490,584 530,605 590,595 C650,585 710,568 800,575 L800,700 L0,700 Z"
            fill="#040c05"
          />
          {/* Foreground tree silhouettes */}
          {[20,55,95,135,175,215,265,320,375,430,490,545,605,660,720,775].map((x, i) => {
            const h = 28 + (i % 5) * 10
            const base = 580 + (i % 3) * 6
            return (
              <g key={x}>
                <polygon points={`${x},${base - h} ${x - 9},${base} ${x + 9},${base}`} fill="#030a04" />
                <polygon points={`${x},${base - h - 12} ${x - 6},${base - h + 6} ${x + 6},${base - h + 6}`} fill="#030a04" />
              </g>
            )
          })}
          {/* Atmospheric mist — gradient overlay */}
          <defs>
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#060e08" stopOpacity="1"/>
              <stop offset="35%" stopColor="#060e08" stopOpacity="0"/>
              <stop offset="75%" stopColor="#060e08" stopOpacity="0"/>
              <stop offset="100%" stopColor="#060e08" stopOpacity="0.6"/>
            </linearGradient>
          </defs>
          <rect width="800" height="700" fill="url(#mist)" />
        </svg>

        {/* Subtle green ambient glow at horizon */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: '10%', right: '10%',
            top: '52%',
            height: '120px',
            background: 'radial-gradient(ellipse, rgba(34,197,94,0.07) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        {/* Logo top-left */}
        <div className="relative z-10 flex items-center gap-3 px-12 pt-10">
          <svg className="w-7 h-7 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22V12M12 12C12 12 7 10 7 5a5 5 0 0 1 10 0c0 5-5 7-5 7z"/>
          </svg>
          <span className="text-white/50 text-sm tracking-[0.12em] font-light">PWR Lab</span>
        </div>

        {/* Center hero text */}
        <div className="relative z-10 px-12 pb-2">
          <p className="text-green-500/60 text-[10px] tracking-[0.3em] uppercase mb-4 font-medium">
            Plant Water Relations Lab
          </p>
          <h1
            className="serif-cn text-white leading-tight mb-5"
            style={{ fontSize: 'clamp(2rem, 3vw, 2.75rem)', fontWeight: 700, letterSpacing: '-0.01em' }}
          >
            北京林业大学<br />
            <span style={{ color: '#4ade80' }}>人工林水分关系</span><br />
            实验室
          </h1>
          <p className="text-white/30 text-sm leading-relaxed max-w-xs">
            科研数据管理平台，统一追踪学生进展、野外站点与科研成果。
          </p>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 flex items-center justify-between px-12 pb-10">
          <p className="text-white/15 text-xs tracking-wide">© 2025 北京林业大学</p>
          <div className="flex gap-1.5">
            {[1,2,3].map(i => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: i === 1 ? 'rgba(74,222,128,0.5)' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative"
        style={{ backgroundColor: '#f5f3ef' }}
      >
        {/* Subtle corner decoration */}
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(26,58,42,0.04), transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 pointer-events-none"
          style={{ background: 'radial-gradient(circle at bottom left, rgba(26,58,42,0.04), transparent 70%)' }}
        />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <svg className="w-10 h-10 text-green-700 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22V12M12 12C12 12 7 10 7 5a5 5 0 0 1 10 0c0 5-5 7-5 7z"/>
          </svg>
          <h2 className="serif-cn text-gray-900 font-bold text-xl">PWR Lab</h2>
          <p className="text-gray-400 text-sm mt-1">学生管理系统</p>
        </div>

        <div className="w-full max-w-[340px]">
          {/* Heading */}
          <div className="mb-10">
            <h2 className="serif-cn text-3xl font-bold text-gray-900 leading-tight">登录</h2>
            <p className="text-gray-400 text-sm mt-2">使用您的实验室账号继续</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm text-red-600 border border-red-200 bg-red-50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Email */}
            <div className="relative">
              <label className="absolute -top-2 left-0 text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400">
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent pt-4 pb-2 text-sm text-gray-900 outline-none placeholder-gray-300 transition-colors"
                style={{ borderBottom: '1.5px solid #d1cdc6' }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = '#1a3a2a' }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = '#d1cdc6' }}
                placeholder="your@bjfu.edu.cn"
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <label className="absolute -top-2 left-0 text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent pt-4 pb-2 text-sm text-gray-900 outline-none placeholder-gray-300 transition-colors"
                style={{ borderBottom: '1.5px solid #d1cdc6' }}
                onFocus={e => { e.currentTarget.style.borderBottomColor = '#1a3a2a' }}
                onBlur={e => { e.currentTarget.style.borderBottomColor = '#d1cdc6' }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #0f2a1c 0%, #1a3a2a 50%, #0f2a1c 100%)',
                  boxShadow: '0 4px 20px rgba(15,42,28,0.3)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(15,42,28,0.45)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,42,28,0.3)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    登录中...
                  </span>
                ) : '进入系统'}
              </button>
            </div>
          </form>

          <p className="mt-12 text-center text-gray-300 text-xs">
            © 2025 PWR Lab · 植物水分关系实验室
          </p>
        </div>
      </div>
    </div>
  )
}
