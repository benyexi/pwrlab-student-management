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
    <div className="min-h-screen flex" style={{ backgroundColor: '#0d1f15' }}>

      {/* ── Left brand panel (desktop only) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden px-14 py-12"
        style={{ background: 'linear-gradient(145deg, #0d2417 0%, #1a3a2a 55%, #0f2d1e 100%)' }}
      >
        {/* Grid texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Ambient glows */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.12), transparent 70%)' }} />
        <div className="absolute -bottom-24 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.10), transparent 70%)' }} />

        {/* Logo row */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-white/90 font-semibold tracking-wide text-sm">PWR Lab</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-5">
          <p className="text-green-400/80 text-xs font-medium tracking-[0.25em] uppercase">植物水分关系实验室</p>
          <h2 className="text-4xl font-bold text-white leading-snug">
            北京林业大学<br />
            <span className="text-green-400">学生科研管理</span><br />
            平台
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            统一管理学生信息、科研进展、论文状态、野外站点数据与仪器预约。
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['研究进展看板', '论文管理', '野外站点', '仪器预约'].map(f => (
              <span key={f} className="px-3 py-1 rounded-full text-xs text-green-300/80 border border-green-500/20" style={{ backgroundColor: 'rgba(74,222,128,0.07)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-white/25 text-xs">© 2025 PWR Lab · Beijing Forestry University</p>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.25)' }}>
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl">PWR Lab</h1>
          <p className="text-green-400/70 text-sm mt-1">学生管理系统</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">欢迎回来</h2>
            <p className="text-white/40 text-sm mt-1.5">请使用您的实验室账号登录</p>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 border border-red-500/30" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(74,222,128,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                placeholder="your@bjfu.edu.cn"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(74,222,128,0.5)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)' }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)' }}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', boxShadow: '0 4px 24px rgba(22,163,74,0.35)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 28px rgba(22,163,74,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(22,163,74,0.35)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  登录中...
                </span>
              ) : '登录'}
            </button>
          </form>

          <p className="mt-8 text-center text-white/20 text-xs">
            © 2025 PWR Lab · 植物水分关系实验室
          </p>
        </div>
      </div>
    </div>
  )
}
