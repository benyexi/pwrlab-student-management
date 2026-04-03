import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, supabase } from '../lib/supabase'
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

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
  const [loading, setLoading] = useState(true)

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
      getStudents().then(({ data }) => {
        setStudents(data ?? [])
        setLoading(false)
      })
    }
  }, [user])

  const stats = computeStats(students)
  const recent = [...students].slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user?.role === 'student') {
    const myStudent = students[0]
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900">个人概览</h1>
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
                </div>
                <span className={statusColor[myStudent.status] ?? 'badge-gray'}>{myStudent.status}</span>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">我的论文（{myPapers.length} 篇）</h2>
                <Link to="/papers" className="text-xs text-primary-600 hover:text-primary-700 font-medium">查看全部 →</Link>
              </div>
              {myPapers.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">暂无论文记录</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {myPapers.slice(0, 5).map((p) => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-700">毕业节点</h2>
                <Link to="/milestones" className="text-xs text-primary-600 hover:text-primary-700 font-medium">查看全部 →</Link>
              </div>
              {myMilestones.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">暂无节点信息</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {myMilestones.map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                      <span className="text-sm text-gray-700">{m.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{m.planned_date}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{m.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">概览</h1>
        <p className="text-sm text-gray-500 mt-0.5">PWR Lab 学生整体情况</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="学生总数" value={stats.total} color="text-primary-700" />
        <StatCard label="在读" value={stats.active} sub="当前在籍" color="text-green-600" />
        <StatCard label="已毕业" value={stats.graduated} color="text-gray-500" />
        <StatCard label="硕士" value={stats.masters} color="text-blue-600" />
        <StatCard label="博士" value={stats.phd} color="text-purple-600" />
        <StatCard label="博士后" value={stats.postdoc} color="text-yellow-600" />
      </div>

      {/* Enrollment by year */}
      {Object.keys(stats.byYear).length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">各年级人数</h2>
          <div className="space-y-2">
            {Object.entries(stats.byYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, count]) => (
                <div key={year} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-12 flex-shrink-0">{year}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent students */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">最近添加的学生</h2>
          <Link to="/students" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            查看全部 →
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            暂无学生数据，
            <Link to="/students" className="text-primary-600 hover:underline">去添加</Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.map((s) => (
              <Link
                key={s.id}
                to={`/students/${s.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-semibold text-sm">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.research_direction}</p>
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
