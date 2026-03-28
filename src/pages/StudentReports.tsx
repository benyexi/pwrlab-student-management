import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  User,
  X,
  AlertTriangle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Report, ReportRow, Student } from '../types'

type ReportFormState = {
  week_start: string
  week_end: string
  content: string
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
  }
}

export default function StudentReports() {
  const { studentId } = useParams<{ studentId: string }>()
  const navigate = useNavigate()

  const [student, setStudent] = useState<Student | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formError, setFormError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget>(null)
  const [form, setForm] = useState<ReportFormState>(makeDefaultForm)

  const mapReports = (rows: ReportRow[], fallbackStudentId: string, fallbackStudentName: string) => {
    const normalized = rows.map((row) => ({
      id: row.id,
      student_id: row.student_id || fallbackStudentId,
      student_name: row.student_name || fallbackStudentName,
      week_start: row.week_start || '',
      week_end: row.week_end || '',
      content: row.content || '',
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

      try {
        const studentResult = await supabase.from('students').select('*').eq('id', studentId).single()

        if (!mounted) return

        if (studentResult.error) {
          setError(studentResult.error.message)
          setStudent(null)
          setReports([])
          return
        }

        const nextStudent = studentResult.data as Student
        setStudent(nextStudent)

        const [reportsByIdResult, reportsByNameResult] = await Promise.all([
          supabase.from('reports').select('*').eq('student_id', studentId).order('week_start', { ascending: false }),
          supabase.from('reports').select('*').eq('student_name', nextStudent.name).order('week_start', { ascending: false }),
        ])

        if (!mounted) return

        if (reportsByIdResult.error || reportsByNameResult.error) {
          setError(reportsByIdResult.error?.message || reportsByNameResult.error?.message || '加载周报失败')
          setReports([])
        } else {
          const nextReports = mapReports(
            [...(reportsByIdResult.data || []), ...(reportsByNameResult.data || [])],
            studentId || '',
            nextStudent.name || ''
          )
          setReports(nextReports)
          setExpandedId((current) => current ?? (nextReports[0]?.id ?? null))
        }
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
  }, [studentId])

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
    const [reportsByIdResult, reportsByNameResult] = await Promise.all([
      supabase.from('reports').select('*').eq('student_id', studentId).order('week_start', { ascending: false }),
      supabase.from('reports').select('*').eq('student_name', student.name).order('week_start', { ascending: false }),
    ])

    if (reportsByIdResult.error || reportsByNameResult.error) {
      setError(reportsByIdResult.error?.message || reportsByNameResult.error?.message || '刷新周报失败')
      return
    }

    setReports(mapReports([...(reportsByIdResult.data || []), ...(reportsByNameResult.data || [])], studentId, student.name || ''))
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

    const [existingByIdResult, existingByNameResult] = await Promise.all([
      supabase.from('reports').select('id,week_start').eq('student_id', studentId),
      supabase.from('reports').select('id,week_start').eq('student_name', student.name),
    ])

    if (existingByIdResult.error || existingByNameResult.error) {
      setFormError(existingByIdResult.error?.message || existingByNameResult.error?.message || '查重失败')
      setSaving(false)
      return
    }

    const nextWeekKey = getIsoWeekKey(form.week_start)
    const existingRows = [...(existingByIdResult.data || []), ...(existingByNameResult.data || [])]
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
              <label className="block text-sm text-gray-600 mb-1">周报内容</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                className="w-full min-h-[220px] px-3 py-2 border rounded-lg text-sm leading-6 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="填写本周工作、问题、下一步计划..."
                required
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

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditForm(report)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm hover:bg-blue-100 w-full sm:w-auto justify-center"
                    >
                      <Edit2 className="w-4 h-4" />
                      修改
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDelete(report)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm hover:bg-red-100 w-full sm:w-auto justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
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

                  {report.advisor_comment && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="text-xs font-medium text-blue-700 mb-1">导师批注</div>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{report.advisor_comment}</p>
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
