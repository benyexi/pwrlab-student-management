import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Edit2,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  User,
  X,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { canAccessStudent } from '../lib/studentOwnership'
import type { Report, ReportRow, Student } from '../types'

type ReportFormState = {
  week_start: string
  week_end: string
  content: string
  next_week_plan: string
}

type DeleteTarget = Report | null

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function getCurrentIsoWeekRange() {
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    week_start: toDateInput(monday),
    week_end: toDateInput(sunday),
  }
}

function getIsoWeekInfo(dateStr: string) {
  const source = new Date(`${dateStr}T00:00:00`)
  const utc = new Date(Date.UTC(source.getFullYear(), source.getMonth(), source.getDate()))
  const dayNum = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
  const isoYear = utc.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { isoYear, week }
}

function getIsoWeekKey(dateStr: string) {
  const { isoYear, week } = getIsoWeekInfo(dateStr)
  return `${isoYear}-W${pad2(week)}`
}

function formatRangeLabel(weekStart: string, weekEnd: string) {
  const { isoYear, week } = getIsoWeekInfo(weekStart)
  const start = new Date(`${weekStart}T00:00:00`)
  const end = new Date(`${weekEnd}T00:00:00`)
  return `${isoYear} 年第 ${pad2(week)} 周（${start.getMonth() + 1}月${start.getDate()}日-${end.getMonth() + 1}月${end.getDate()}日）`
}

function makeDefaultForm(): ReportFormState {
  const { week_start, week_end } = getCurrentIsoWeekRange()
  return {
    week_start,
    week_end,
    content: '',
    next_week_plan: '',
  }
}

export default function StudentReports() {
  const { user } = useAuth()
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = student ? `${student.name}的周报 | PWRlab` : '周报详情 | PWRlab'
  }, [student])

  const [student, setStudent] = useState<Student | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [forbidden, setForbidden] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget>(null)
  const [form, setForm] = useState<ReportFormState>(makeDefaultForm)

  // Advisor comment state
  const [commentingId, setCommentingId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  const mapReports = (rows: ReportRow[], fallbackStudentId: string, fallbackStudentName: string) => {
    const normalized = rows.map((row) => ({
      id: row.id,
      student_id: row.student_id || fallbackStudentId,
      student_name: row.student_name || fallbackStudentName,
      week_start: row.week_start || '',
      week_end: row.week_end || '',
      content: row.content || '',
      next_week_plan: (row as any).next_week_plan || undefined,
      advisor_comment: row.advisor_comment || undefined,
      created_at: row.created_at || undefined,
      updated_at: row.updated_at || undefined,
    })) as Report[]

    const dedupedMap = new Map<string, Report>()
    for (const report of normalized) {
      dedupedMap.set(report.id, report)
    }
    return Array.from(dedupedMap.values())
  }

  useEffect(() => {
    if (!studentId) {
      setError('缺少学生 ID')
      setLoading(false)
      return
    }

    let mounted = true

    async function fetchStudentReports() {
      setLoading(true)
      setError('')
      setForbidden(false)

      try {
        const [studentResult, allStudentsResult] = await Promise.all([
          supabase.from('students').select('*').eq('id', studentId).single(),
          supabase.from('students').select('*'),
        ])

        if (!mounted) return

        if (studentResult.error) {
          setError(studentResult.error.message)
          setStudent(null)
          setReports([])
          return
        }

        const nextStudent = studentResult.data as Student
        setStudent(nextStudent)

        if (!mounted) return

        if (user?.role === 'student') {
          const ownershipPool = allStudentsResult.error
            ? [nextStudent]
            : ((allStudentsResult.data || []) as Student[])

          if (!canAccessStudent(nextStudent, ownershipPool, user)) {
            setForbidden(true)
            setReports([])
            return
          }
        }

        const reportsByIdResult = await supabase
          .from('reports')
          .select('*')
          .eq('student_id', studentId)
          .order('week_start', { ascending: false })

        if (!mounted) return

        if (reportsByIdResult.error) {
          setError(reportsByIdResult.error.message || '加载周报失败')
          setReports([])
          return
        }

        let mergedRows: ReportRow[] = [...(reportsByIdResult.data || [])]

        const studentEmail = (nextStudent.email || '').trim().toLowerCase()
        const userEmail = (user?.email || '').trim().toLowerCase()
        const canUseNameFallback = user?.role !== 'student' || Boolean(studentEmail && userEmail && studentEmail === userEmail)

        if (canUseNameFallback && nextStudent.name) {
          const reportsByNameResult = await supabase
            .from('reports')
            .select('*')
            .eq('student_name', nextStudent.name)
            .order('week_start', { ascending: false })

          if (reportsByNameResult.error) {
            setError(reportsByNameResult.error.message || '加载周报失败')
            setReports([])
            return
          }

          if (user?.role === 'student') {
            mergedRows = [
              ...mergedRows,
              ...(reportsByNameResult.data || []).filter((row) => !row.student_id || row.student_id === studentId),
            ]
          } else {
            mergedRows = [...mergedRows, ...(reportsByNameResult.data || [])]
          }
        }

        const nextReports = mapReports(
          mergedRows,
          studentId || '',
          nextStudent.name || ''
        )
        setReports(nextReports)
        setExpandedId((current) => current ?? (nextReports[0]?.id ?? null))
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchStudentReports()

    return () => {
      mounted = false
    }
  }, [studentId, user])

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        if (a.week_start !== b.week_start) {
          return b.week_start.localeCompare(a.week_start)
        }
        return b.week_end.localeCompare(a.week_end)
      }),
    [reports]
  )

  const openCreateForm = () => {
    setEditingId(null)
    setForm(makeDefaultForm())
    setFormError('')
    setShowForm(true)
  }

  const openEditForm = (report: Report) => {
    setEditingId(report.id)
    setForm({
      week_start: report.week_start,
      week_end: report.week_end,
      content: report.content,
      next_week_plan: report.next_week_plan || '',
    })
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormError('')
  }

  const refreshReports = async () => {
    if (!studentId || !student) return

    const reportsByIdResult = await supabase
      .from('reports')
      .select('*')
      .eq('student_id', studentId)
      .order('week_start', { ascending: false })

    if (reportsByIdResult.error) {
      setError(reportsByIdResult.error.message || '刷新周报失败')
      return
    }

    let mergedRows: ReportRow[] = [...(reportsByIdResult.data || [])]
    const studentEmail = (student.email || '').trim().toLowerCase()
    const userEmail = (user?.email || '').trim().toLowerCase()
    const canUseNameFallback = user?.role !== 'student' || Boolean(studentEmail && userEmail && studentEmail === userEmail)

    if (canUseNameFallback && student.name) {
      const reportsByNameResult = await supabase
        .from('reports')
        .select('*')
        .eq('student_name', student.name)
        .order('week_start', { ascending: false })

      if (reportsByNameResult.error) {
        setError(reportsByNameResult.error.message || '刷新周报失败')
        return
      }

      if (user?.role === 'student') {
        mergedRows = [
          ...mergedRows,
          ...(reportsByNameResult.data || []).filter((row) => !row.student_id || row.student_id === studentId),
        ]
      } else {
        mergedRows = [...mergedRows, ...(reportsByNameResult.data || [])]
      }
    }

    setReports(mapReports(mergedRows, studentId, student.name || ''))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!studentId || !student) return

    const trimmedContent = form.content.trim()
    if (!trimmedContent) {
      setFormError('周报内容不能为空')
      return
    }
    if (form.week_start > form.week_end) {
      setFormError('开始日期不能晚于结束日期')
      return
    }

    setSaving(true)
    setFormError('')
    setError('')

    const existingByIdResult = await supabase
      .from('reports')
      .select('id,week_start,student_id')
      .eq('student_id', studentId)

    if (existingByIdResult.error) {
      setFormError(existingByIdResult.error.message || '查重失败')
      setSaving(false)
      return
    }

    let existingRows: { id: string; week_start: string | null; student_id?: string | null }[] = [...(existingByIdResult.data || [])]

    const studentEmail = (student.email || '').trim().toLowerCase()
    const userEmail = (user?.email || '').trim().toLowerCase()
    const canUseNameFallback = user?.role !== 'student' || Boolean(studentEmail && userEmail && studentEmail === userEmail)

    if (canUseNameFallback && student.name) {
      const existingByNameResult = await supabase
        .from('reports')
        .select('id,week_start,student_id')
        .eq('student_name', student.name)

      if (existingByNameResult.error) {
        setFormError(existingByNameResult.error.message || '查重失败')
        setSaving(false)
        return
      }

      if (user?.role === 'student') {
        existingRows = [
          ...existingRows,
          ...(existingByNameResult.data || []).filter((row) => !row.student_id || row.student_id === studentId),
        ]
      } else {
        existingRows = [...existingRows, ...(existingByNameResult.data || [])]
      }
    }

    const nextWeekKey = getIsoWeekKey(form.week_start)
    const hasDuplicateWeek = existingRows.some((row) => {
      if (editingId && row.id === editingId) return false
      if (!row.week_start) return false
      return getIsoWeekKey(row.week_start) === nextWeekKey
    })

    if (hasDuplicateWeek) {
      setFormError('同一学生同一周已存在周报，不能重复提交')
      setSaving(false)
      return
    }

    const payload = {
      student_id: studentId,
      student_name: student.name,
      week_start: form.week_start,
      week_end: form.week_end,
      content: trimmedContent,
      next_week_plan: form.next_week_plan.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const action = editingId
      ? supabase.from('reports').update(payload).eq('id', editingId)
      : supabase.from('reports').insert([{ ...payload, advisor_comment: null }])

    const { error: saveError } = await action

    if (saveError) {
      setFormError(saveError.message)
      setSaving(false)
      return
    }

    await refreshReports()
    closeForm()
    setForm(makeDefaultForm())
    setSaving(false)
  }

  const handleDelete = async (report: Report) => {
    const { error: deleteError } = await supabase.from('reports').delete().eq('id', report.id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setPendingDelete(null)
    setReports((prev) => prev.filter((item) => item.id !== report.id))
    if (expandedId === report.id) {
      setExpandedId(null)
    }
  }

  const handleSaveComment = async (reportId: string) => {
    if (!commentText.trim()) return
    setSavingComment(true)
    const { error: commentError } = await supabase
      .from('reports')
      .update({ advisor_comment: commentText.trim(), updated_at: new Date().toISOString() })
      .eq('id', reportId)
    if (commentError) {
      setError(commentError.message)
    } else {
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, advisor_comment: commentText.trim() } : r))
      )
      setCommentingId(null)
      setCommentText('')
    }
    setSavingComment(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-10 w-10 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
      </div>
    )
  }

  if (error && !student) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回周报列表
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          页面加载失败: {error}
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回周报列表
        </button>
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border shadow-sm">
          <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>未找到该学生</p>
        </div>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回周报列表
        </button>
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border shadow-sm">
          <User className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="font-semibold text-gray-700">无权限</p>
          <p className="text-sm mt-1">您只能查看自己的周报</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          返回周报列表
        </button>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          上传周报
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold bg-[#1a3a2a]">
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {student.degree_type} · {student.enrollment_year} 级
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                共 {sortedReports.length} 份周报
              </span>
              <span className="text-gray-500">
                方向：{student.research_direction || '未填写'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? '编辑周报' : '上传周报'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                同一学生在同一周只允许一份周报
              </p>
            </div>
            <button
              onClick={closeForm}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="关闭表单"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">周开始日期</label>
                <input
                  type="date"
                  value={form.week_start}
                  onChange={(e) => setForm((prev) => ({ ...prev, week_start: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">周结束日期</label>
                <input
                  type="date"
                  value={form.week_end}
                  onChange={(e) => setForm((prev) => ({ ...prev, week_end: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">本周工作内容</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full min-h-[180px] px-3 py-2 border rounded-lg text-sm leading-6 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="1. 完成了什么工作&#10;2. 遇到了什么问题&#10;3. 取得了哪些进展"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">下周研究计划</label>
              <textarea
                value={form.next_week_plan}
                onChange={(e) => setForm((prev) => ({ ...prev, next_week_plan: e.target.value }))}
                className="w-full min-h-[120px] px-3 py-2 border rounded-lg text-sm leading-6 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="1. 下周计划做什么&#10;2. 预期完成的目标"
              />
            </div>

            {formError && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? '保存中' : editingId ? '保存修改' : '提交周报'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && student && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {sortedReports.map((report) => {
          const label = formatRangeLabel(report.week_start, report.week_end)
          const isExpanded = expandedId === report.id
          return (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div
                className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{label}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                      {report.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditForm(report)
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="修改"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDelete(report)
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 sm:px-5 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-white border border-gray-100 p-3">
                      <div className="text-xs text-gray-400 mb-1">周开始</div>
                      <div className="font-medium text-gray-800">{report.week_start}</div>
                    </div>
                    <div className="rounded-lg bg-white border border-gray-100 p-3">
                      <div className="text-xs text-gray-400 mb-1">周结束</div>
                      <div className="font-medium text-gray-800">{report.week_end}</div>
                    </div>
                  </div>

                  {report.next_week_plan && (
                    <div className="mt-3 rounded-lg border border-green-100 bg-green-50 p-3">
                      <div className="text-xs font-medium text-green-700 mb-1">下周研究计划</div>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{report.next_week_plan}</p>
                    </div>
                  )}

                  {/* Advisor comment section */}
                  {report.advisor_comment && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-xs font-medium text-blue-700">导师批注</div>
                        {user?.role !== 'student' && commentingId !== report.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCommentingId(report.id)
                              setCommentText(report.advisor_comment || '')
                            }}
                            className="p-1 rounded hover:bg-blue-100 text-blue-500 transition-colors"
                            title="编辑批注"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{report.advisor_comment}</p>
                    </div>
                  )}

                  {user?.role !== 'student' && !report.advisor_comment && commentingId !== report.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCommentingId(report.id)
                        setCommentText('')
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors min-h-[44px]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      添加批注
                    </button>
                  )}

                  {user?.role !== 'student' && commentingId === report.id && (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                      <div className="text-xs font-medium text-blue-700">
                        {report.advisor_comment ? '编辑批注' : '添加批注'}
                      </div>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="w-full min-h-[100px] px-3 py-2 border border-blue-200 rounded-lg text-sm leading-6 focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
                        placeholder="输入导师批注..."
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setCommentingId(null)
                            setCommentText('')
                          }}
                          className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 min-h-[36px]"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          disabled={savingComment || !commentText.trim()}
                          onClick={(e) => {
                            e.stopPropagation()
                            void handleSaveComment(report.id)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 min-h-[36px]"
                        >
                          {savingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                          保存批注
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sortedReports.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl border shadow-sm">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无周报记录</p>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-xl p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">删除周报</h3>
                <p className="mt-1 text-sm text-gray-600">
                  确认删除 {formatRangeLabel(pendingDelete.week_start, pendingDelete.week_end)} 吗？该操作无法撤销。
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
