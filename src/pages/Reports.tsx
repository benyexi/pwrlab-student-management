import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, GraduationCap, BookOpen, CalendarDays, ArrowRight, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { resolveOwnedStudents } from '../lib/studentOwnership'
import type { ReportRow, Student } from '../types'

type StudentReportCard = {
  id: string
  name: string
  degree_type: Student['degree_type']
  enrollment_year: number
  research_direction: string
  submitted: number
  missing: number
  totalWeeks: number
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toISODate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return null
  return date
}

function getISOWeekKey(dateInput: Date) {
  const date = new Date(Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const isoYear = date.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${isoYear}-W${pad2(week)}`
}

function buildRequiredWeeks(startDate: Date, endDate: Date) {
  const keys = new Set<string>()
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    keys.add(getISOWeekKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

export default function Reports() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { document.title = '周报管理 | PWRlab' }, [])

  const [students, setStudents] = useState<Student[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const scopedStudents = useMemo(() => {
    if (user?.role !== 'student') return students
    return resolveOwnedStudents(students, user)
  }, [students, user])

  useEffect(() => {
    let mounted = true

    async function fetchData() {
      setLoading(true)
      setError('')

      const now = new Date()
      const yearStart = new Date(now.getFullYear(), 0, 1)
      const startDate = `${yearStart.getFullYear()}-${pad2(yearStart.getMonth() + 1)}-${pad2(yearStart.getDate())}`
      const endDate = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`

      const [studentsResult, reportsResult] = await Promise.all([
        supabase
          .from('students')
          .select('*')
          .eq('status', '在读')
          .order('enrollment_year', { ascending: false }),
        supabase
          .from('reports')
          .select('id,student_id,student_name,week_start,week_end,content,advisor_comment,created_at,updated_at')
          .gte('week_start', startDate)
          .lte('week_start', endDate)
          .order('week_start', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      if (!mounted) return

      const studentError = studentsResult.error
      const reportError = reportsResult.error

      if (studentError || reportError) {
        setError(studentError?.message || reportError?.message || '加载失败')
        setStudents([])
        setReports([])
        setLoading(false)
        return
      }

      const normalizedStudents = ((studentsResult.data || []) as Partial<Student>[]).map((row) => ({
        id: row.id || '',
        name: row.name || '',
        student_id: row.student_id || '',
        enrollment_year: row.enrollment_year || new Date().getFullYear(),
        degree_type: (row.degree_type || '硕士') as Student['degree_type'],
        research_direction: row.research_direction || '',
        expected_graduation: row.expected_graduation || '',
        status: (row.status || '在读') as Student['status'],
        advisor: row.advisor || '',
        co_advisor: row.co_advisor || '',
        created_at: row.created_at,
        updated_at: row.updated_at,
      }))

      setStudents(normalizedStudents)
      setReports((reportsResult.data || []) as ReportRow[])
      setLoading(false)
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [])

  const cards = useMemo<StudentReportCard[]>(() => {
    const now = new Date()
    // Missing-count starts from next Monday — all weeks before that are ignored.
    // buildRequiredWeeks(future, now) returns an empty set → missing = 0.
    const daysUntilNextMonday = ((8 - now.getDay()) % 7) || 7  // 1–7
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + daysUntilNextMonday)
    const requiredWeeks = buildRequiredWeeks(nextMonday, now)

    const reportsByStudentId = new Map<string, Set<string>>()
    const reportsByStudentName = new Map<string, Set<string>>()
    for (const report of reports) {
      if (!report.week_start) continue
      const weekDate = toISODate(report.week_start)
      if (!weekDate) continue
      const key = getISOWeekKey(weekDate)
      if (report.student_id) {
        if (!reportsByStudentId.has(report.student_id)) {
          reportsByStudentId.set(report.student_id, new Set())
        }
        reportsByStudentId.get(report.student_id)?.add(key)
      }
      if (report.student_name) {
        if (!reportsByStudentName.has(report.student_name)) {
          reportsByStudentName.set(report.student_name, new Set())
        }
        reportsByStudentName.get(report.student_name)?.add(key)
      }
    }

    const filteredStudents = scopedStudents.filter((student) => {
      if (!search.trim()) return true
      const keyword = search.trim().toLowerCase()
      return (
        (student.name || '').toLowerCase().includes(keyword) ||
        (student.degree_type || '').toLowerCase().includes(keyword) ||
        String(student.enrollment_year).includes(keyword) ||
        (student.research_direction || '').toLowerCase().includes(keyword)
      )
    })

    return filteredStudents.map((student) => {
      const submittedWeeks = new Set<string>()
      reportsByStudentId.get(student.id)?.forEach((key) => submittedWeeks.add(key))
      reportsByStudentName.get(student.name)?.forEach((key) => submittedWeeks.add(key))
      const submitted = submittedWeeks.size
      const totalWeeks = requiredWeeks.size
      return {
        id: student.id,
        name: student.name || '未命名',
        degree_type: student.degree_type || '硕士',
        enrollment_year: student.enrollment_year,
        research_direction: student.research_direction || '未填写',
        submitted,
        missing: Math.max(totalWeeks - submitted, 0),
        totalWeeks,
      }
    })
  }, [reports, scopedStudents, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">周报管理</h1>
          <p className="text-sm text-gray-500 mt-1">在校生标签页 · 按 ISO 周统计本年周报提交情况</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名、学位、入学年份、研究方向..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
          在校生
        </span>
        <span className="text-xs text-gray-500">
          共 {scopedStudents.length} 名在校生，展示 {cards.length} 名
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="h-10 w-10 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          加载周报主页失败: {error}
        </div>
      )}

      {!loading && !error && cards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const progress = card.totalWeeks === 0 ? 0 : Math.round((card.submitted / card.totalWeeks) * 100)
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => navigate(`/reports/${card.id}`)}
                className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-700">{card.name}</h2>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                        在读
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {card.degree_type} · {card.enrollment_year}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-green-500" />
                </div>

                <p className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span className="line-clamp-2">{card.research_direction}</span>
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 px-3 py-3">
                    <p className="text-xs text-gray-500">已交份数</p>
                    <p className="mt-1 text-2xl font-bold text-green-600">{card.submitted}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-3 py-3">
                    <p className="text-xs text-gray-500">缺交份数</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600">{card.missing}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      ISO 周进度
                    </span>
                    <span>{card.submitted}/{card.totalWeeks} 周</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!loading && !error && scopedStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-1">暂无在校生数据</h3>
          <p className="text-sm text-gray-300 mb-6">还没有在读学生记录，周报统计暂无数据</p>
          {user?.role === 'admin' && (
            <button onClick={() => navigate('/students')}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#1a3a2a' }}>
              前往学生管理 <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {!loading && !error && scopedStudents.length > 0 && cards.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-500">
          <AlertCircle className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm">没有找到匹配的在校生</p>
        </div>
      )}
    </div>
  )
}
