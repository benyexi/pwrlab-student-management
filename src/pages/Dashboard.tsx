import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ElementType } from 'react'
import { Users, BookOpen, GraduationCap, FlaskConical, Microscope, Beaker, Pencil, MessageCircle } from 'lucide-react'
import { getStudents, updateStudent, supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { resolveOwnedStudents } from '../lib/studentOwnership'
import type { Student, DashboardStats } from '../types'

function computeStats(students: Student[]): DashboardStats {
  const byYear: Record<number, number> = {}
  students.forEach((s) => {
    byYear[s.enrollment_year] = (byYear[s.enrollment_year] ?? 0) + 1
  })
  return {
    total: students.length,
    active: students.filter((s) => s.status === '在读').length,
    graduated: students.filter((s) => s.status === '已毕业').length,
    masters: students.filter((s) => s.degree_type === '硕士').length,
    phd: students.filter((s) => s.degree_type === '博士').length,
    postdoc: students.filter((s) => s.degree_type === '博士后').length,
    byYear,
  }
}

/** Large dark card for hero metrics */
function HeroCard({ label, value, sub, icon: Icon }: { label: string; value: number; sub?: string; icon: ElementType }) {
  return (
    <div
      className="relative rounded-2xl p-7 overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #132d22 0%, #1e4530 100%)',
        boxShadow: '0 16px 48px rgba(13,36,23,0.28)',
      }}
    >
      {/* Subtle grid texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`hg-${label}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#hg-${label})`} />
      </svg>
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.12), transparent 70%)' }} />

      <div className="relative z-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-green-400/50 font-medium">{label}</p>
          <p
            className="font-bold mt-3 leading-none"
            style={{ fontSize: '3.75rem', color: '#d4a853', fontVariantNumeric: 'tabular-nums' }}
          >
            {value}
          </p>
          {sub && <p className="text-green-300/40 text-sm mt-2">{sub}</p>}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.12)' }}>
          <Icon className="w-6 h-6 text-green-400/50" />
        </div>
      </div>
    </div>
  )
}

/** Smaller clean card for secondary metrics */
function MiniCard({
  label,
  value,
  accentColor,
  icon: Icon,
}: {
  label: string
  value: number
  accentColor: string
  icon: ElementType
}) {
  return (
    <div
      className="bg-white rounded-2xl p-5 relative overflow-hidden"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderTop: `3px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
          <p className="text-4xl font-bold text-gray-900 mt-2" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
        </div>
        <Icon className="w-5 h-5 mt-0.5" style={{ color: accentColor, opacity: 0.6 }} />
      </div>
    </div>
  )
}

const degreeColor: Record<string, string> = {
  '硕士': 'badge-blue',
  '博士': 'badge-purple',
  '博士后': 'badge-yellow',
}

const statusColor: Record<string, string> = {
  '在读': 'badge-green',
  '已毕业': 'badge-gray',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [myPapers, setMyPapers] = useState<{ id: string; title: string; status: string; authors: string; student_id?: string; student_name?: string }[]>([])
  const [myMilestones, setMyMilestones] = useState<{ id: string; type: string; status: string; planned_date: string; student_id?: string; student_name?: string }[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ research_direction: '', expected_graduation: '', email: '', phone: '', notes: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingQuestions, setPendingQuestions] = useState(0)

  useEffect(() => { document.title = '仪表盘 | PWRlab' }, [])

  useEffect(() => {
    if (user?.role === 'student') {
      Promise.all([
        supabase.from('students').select('*'),
        supabase.from('papers').select('id, title, status, authors, student_id, student_name').order('created_at', { ascending: false }),
        supabase.from('milestones').select('id, type, status, planned_date, student_id, student_name').order('planned_date', { ascending: true }),
      ]).then(([studRes, papersRes, milestonesRes]) => {
        const allStudents = (studRes.data || []) as Student[]
        const ownedStudents = resolveOwnedStudents(allStudents, user)
        const ownedStudentIds = new Set(ownedStudents.map((student) => student.id))
        const ownedStudentNames = new Set(ownedStudents.map((student) => student.name))

        setStudents(ownedStudents)

        const allPapers = (papersRes.data || []) as { id: string; title: string; status: string; authors: string; student_id?: string; student_name?: string }[]
        setMyPapers(
          allPapers.filter((paper) => {
            const byStudent =
              (paper.student_id && ownedStudentIds.has(paper.student_id)) ||
              (paper.student_name && ownedStudentNames.has(paper.student_name))
            const byAuthor = (paper.authors || '').includes(user.name)
            return Boolean(byStudent || byAuthor)
          })
        )

        const allMilestones = (milestonesRes.data || []) as { id: string; type: string; status: string; planned_date: string; student_id?: string; student_name?: string }[]
        setMyMilestones(
          allMilestones.filter((milestone) =>
            (milestone.student_id && ownedStudentIds.has(milestone.student_id)) ||
            (milestone.student_name && ownedStudentNames.has(milestone.student_name))
          )
        )
        setLoading(false)
      })
    } else {
      Promise.all([
        getStudents(),
        supabase.from('questions').select('id', { count: 'exact', head: true }).eq('status', '待回复'),
      ]).then(([studRes, questionsRes]) => {
        setStudents(studRes.data ?? [])
        setPendingQuestions(questionsRes.count ?? 0)
        setLoading(false)
      })
    }
  }, [user])

  const stats = computeStats(students)
  const recent = [...students].slice(0, 5)
  const yearEntries = Object.entries(stats.byYear).sort(([a], [b]) => Number(b) - Number(a))
  const maxCount = Math.max(...yearEntries.map(([, c]) => c), 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user?.role === 'student') {
    const myStudent = students[0]

    const openEdit = () => {
      if (!myStudent) return
      setEditForm({
        research_direction: myStudent.research_direction ?? '',
        expected_graduation: myStudent.expected_graduation ?? '',
        email: myStudent.email ?? '',
        phone: myStudent.phone ?? '',
        notes: myStudent.notes ?? '',
      })
      setEditMsg(null)
      setShowEditModal(true)
    }

    const handleEditSave = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!myStudent) return
      setEditSaving(true)
      const { error } = await updateStudent(myStudent.id, {
        research_direction: editForm.research_direction,
        expected_graduation: editForm.expected_graduation,
        email: editForm.email,
        phone: editForm.phone,
        notes: editForm.notes,
      })
      setEditSaving(false)
      if (error) {
        setEditMsg({ type: 'err', text: (error as Error).message })
      } else {
        setStudents(prev => prev.map(s => s.id === myStudent.id ? { ...s, ...editForm } : s))
        setEditMsg({ type: 'ok', text: '信息已更新' })
        setTimeout(() => { setShowEditModal(false); setEditMsg(null) }, 1200)
      }
    }

    return (
      <>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900 serif-cn">个人概览</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user.name} 的学习与科研进展</p>
        </div>
        {!myStudent ? (
          <div className="card p-8 text-center text-gray-400 text-sm">
            暂无个人信息，请联系导师添加学生记录
          </div>
        ) : (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {myStudent.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900">{myStudent.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {myStudent.degree_type} · {myStudent.enrollment_year} 级 · {myStudent.research_direction}
                  </p>
                  {myStudent.email && <p className="text-xs text-gray-400 mt-0.5">{myStudent.email}{myStudent.phone ? ' · ' + myStudent.phone : ''}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusColor[myStudent.status] ?? 'badge-gray'}>{myStudent.status}</span>
                  <button onClick={openEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="编辑我的信息">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* Papers — pipeline view */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">我的论文（{myPapers.length} 篇）</h2>
                <Link to="/papers" className="text-xs text-primary-600 hover:text-primary-700 font-medium">管理论文 →</Link>
              </div>
              {myPapers.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">暂无论文记录，前往"论文管理"添加</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {myPapers.slice(0, 6).map((p) => {
                    const PIPELINE = ['在写','投稿中','审稿中','修改中','已接收','已发表']
                    const idx = PIPELINE.indexOf(p.status)
                    const pct = idx < 0 ? 0 : Math.round((idx + 1) / PIPELINE.length * 100)
                    const statusCls: Record<string, string> = {
                      '在写': 'bg-gray-100 text-gray-600',
                      '投稿中': 'bg-blue-100 text-blue-700',
                      '审稿中': 'bg-yellow-100 text-yellow-700',
                      '修改中': 'bg-orange-100 text-orange-700',
                      '已接收': 'bg-green-100 text-green-700',
                      '已发表': 'bg-primary-100 text-primary-700',
                    }
                    return (
                      <div key={p.id} className="px-5 py-3.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-medium text-gray-900 truncate flex-1">{p.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusCls[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Milestones — countdown timeline */}
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">毕业节点</h2>
                <Link to="/milestones" className="text-xs text-primary-600 hover:text-primary-700 font-medium">查看详情 →</Link>
              </div>
              {myMilestones.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">暂无节点，请联系导师添加</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {myMilestones.map((m) => {
                    const today = new Date(); today.setHours(0,0,0,0)
                    const planned = m.planned_date ? new Date(m.planned_date) : null
                    const diffDays = planned ? Math.round((planned.getTime() - today.getTime()) / 86400000) : null
                    const statusCls: Record<string, string> = {
                      '未开始': 'bg-gray-100 text-gray-600',
                      '进行中': 'bg-blue-100 text-blue-700',
                      '已完成': 'bg-green-100 text-green-700',
                      '已逾期': 'bg-red-100 text-red-700',
                    }
                    return (
                      <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${statusCls[m.status] ?? 'bg-gray-100 text-gray-600'}`}>{m.status}</span>
                          <span className="text-sm text-gray-800 font-medium">{m.type}</span>
                        </div>
                        <div className="text-right text-xs shrink-0">
                          <p className="text-gray-400">{m.planned_date}</p>
                          {m.status !== '已完成' && diffDays !== null && (
                            <p className={diffDays < 0 ? 'text-red-500 font-medium' : diffDays <= 30 ? 'text-yellow-600 font-medium' : 'text-gray-400'}>
                              {diffDays < 0 ? `逾期 ${-diffDays} 天` : diffDays === 0 ? '今天' : `还有 ${diffDays} 天`}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit my info modal */}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">编辑我的信息</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleEditSave} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {editMsg && (
                <div className={`px-4 py-2 rounded-lg text-sm ${editMsg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {editMsg.text}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">研究方向</label>
                <textarea
                  rows={2}
                  value={editForm.research_direction}
                  onChange={e => setEditForm(f => ({ ...f, research_direction: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预计毕业时间</label>
                <input
                  type="text"
                  placeholder="如 2027"
                  value={editForm.expected_graduation}
                  onChange={e => setEditForm(f => ({ ...f, expected_graduation: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              <p className="text-xs text-gray-400">姓名、学号、入学年份、学位类型由导师管理，如需修改请联系席老师。</p>
            </form>
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">取消</button>
              <button type="submit" form="" disabled={editSaving} onClick={handleEditSave} className="btn-primary">
                {editSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page title */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 serif-cn">概览</h1>
          <p className="text-sm text-gray-400 mt-0.5 tracking-wide">PWR Lab · 学生整体情况</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          实时数据
        </div>
      </div>

      {/* Hero stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <HeroCard label="学生总数" value={stats.total} sub="全部在册学生" icon={Users} />
        <HeroCard label="当前在读" value={stats.active} sub="当前在籍" icon={BookOpen} />
      </div>

      {/* Mini stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniCard label="已毕业" value={stats.graduated} accentColor="#9ca3af" icon={GraduationCap} />
        <MiniCard label="硕士" value={stats.masters} accentColor="#3b82f6" icon={FlaskConical} />
        <MiniCard label="博士" value={stats.phd} accentColor="#8b5cf6" icon={Microscope} />
        <MiniCard label="博士后" value={stats.postdoc} accentColor="#f59e0b" icon={Beaker} />
      </div>

      {/* Pending questions alert */}
      {pendingQuestions > 0 && (
        <Link to="/questions" className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors">
          <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">有 {pendingQuestions} 条提问待回复</p>
            <p className="text-xs text-amber-600 mt-0.5">点击前往提问答疑页面处理</p>
          </div>
          <span className="text-amber-400 text-sm">→</span>
        </Link>
      )}

      {/* Enrollment by year */}
      {yearEntries.length > 0 && (
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
          <h2 className="text-sm font-semibold text-gray-700 mb-5 serif-cn">各年级人数</h2>
          <div className="space-y-3">
            {yearEntries.map(([year, count]) => (
              <div key={year} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500 w-10 flex-shrink-0 tabular-nums">{year}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: 'linear-gradient(90deg, #1a3a2a 0%, #4da37c 100%)',
                    }}
                  />
                </div>
                <span
                  className="text-sm font-bold w-5 text-right tabular-nums"
                  style={{ color: count === maxCount ? '#d4a853' : '#374151' }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent students */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800 serif-cn">最近添加的学生</h2>
          <Link to="/students" className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
            查看全部 →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            暂无学生数据，
            <Link to="/students" className="text-primary-600 hover:underline">去添加</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((s) => (
              <Link
                key={s.id}
                to={`/students/${s.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-[#f5f3ef] transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg, #1a3a2a 0%, #4da37c 100%)', boxShadow: '0 2px 8px rgba(26,58,42,0.3)' }}
                >
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{s.research_direction}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={degreeColor[s.degree_type] ?? 'badge-gray'}>{s.degree_type}</span>
                  <span className={statusColor[s.status] ?? 'badge-gray'}>{s.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
