import { useEffect, useMemo, useState } from 'react'
import { FileText, Search, MessageSquare, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Report } from '../types'

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchReports() {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false, nullsFirst: false })

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
        setReports([])
      } else {
        const nextReports = (data || []).map((row) => ({
          id: row.id,
          student_id: row.student_id || '',
          student_name: row.student_name || '',
          week_start: row.week_start || '',
          week_end: row.week_end || '',
          content: row.content || '',
          advisor_comment: row.advisor_comment || undefined,
          created_at: row.created_at || undefined,
          updated_at: row.updated_at || undefined,
        })) as Report[]
        setReports(nextReports)
        setExpandedId((current) => current ?? nextReports[0]?.id ?? null)
      }

      setLoading(false)
    }

    fetchReports()

    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.student_name.includes(search) ||
          r.content.includes(search) ||
          (r.advisor_comment || '').includes(search)
      ),
    [reports, search]
  )

  const handleComment = async (reportId: string) => {
    const comment = comments[reportId]
    if (!comment?.trim()) return

    setSavingId(reportId)
    setError('')

    const { error: updateError } = await supabase
      .from('reports')
      .update({
        advisor_comment: comment.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (updateError) {
      setError(updateError.message)
      setSavingId(null)
      return
    }

    setReports((prev) =>
      prev.map((report) =>
        report.id === reportId
          ? { ...report, advisor_comment: comment.trim(), updated_at: new Date().toISOString() }
          : report
      )
    )
    setComments((prev) => ({ ...prev, [reportId]: '' }))
    setSavingId(null)
  }

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-gray-800 mt-3 mb-1">{line.slice(3)}</h3>
      if (line.startsWith('- ') || line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 text-gray-600 text-sm">{line.replace(/^[-\d.]+\s/, '')}</li>
      if (line.trim() === '') return <br key={i} />
      return <p key={i} className="text-gray-600 text-sm">{line}</p>
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">周报管理</h1>
          <p className="text-gray-500 text-sm mt-1">共 {reports.length} 份周报</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索学生或内容..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64" />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="h-10 w-10 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          加载周报失败: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-4">
          {filtered.map((report) => {
            const isExpanded = expandedId === report.id
            return (
              <div key={report.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{report.student_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {report.week_start} ~ {report.week_end}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.advisor_comment && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />已批注
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Content */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="p-5">
                      <div className="prose prose-sm max-w-none">
                        {renderContent(report.content)}
                      </div>
                    </div>

                    {/* Advisor comment */}
                    {report.advisor_comment && (
                      <div className="mx-5 mb-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-700 mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />导师批注
                        </p>
                        <p className="text-sm text-blue-800">{report.advisor_comment}</p>
                      </div>
                    )}

                    {/* Comment input */}
                    <div className="px-5 pb-4 flex gap-2">
                      <input
                        type="text"
                        placeholder="添加批注..."
                        value={comments[report.id] || ''}
                        onChange={(e) => setComments((prev) => ({ ...prev, [report.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleComment(report.id)}
                      />
                      <button
                        onClick={() => handleComment(report.id)}
                        disabled={savingId === report.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {savingId === report.id ? '保存中' : '发送'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的周报</p>
        </div>
      )}
    </div>
  )
}
