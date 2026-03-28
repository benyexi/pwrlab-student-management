import { useEffect, useMemo, useState } from 'react'
import { FileText, Search, Plus, X, Clock, BarChart3, BookOpen, Edit2, Trash2, Layers, CalendarDays } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Paper, PaperPartition, PaperStatus } from '../types'

const STATUS_COLORS: Record<PaperStatus, string> = {
  '在写': 'bg-gray-100 text-gray-600',
  '投稿中': 'bg-blue-50 text-blue-600',
  '审稿中': 'bg-amber-50 text-amber-600',
  '修改中': 'bg-orange-50 text-orange-600',
  '已接收': 'bg-green-50 text-green-600',
  '已发表': 'bg-emerald-50 text-emerald-700',
}

const PARTITION_OPTIONS: PaperPartition[] = ['1区', '2区', '3区', '4区', '2区TOP']

type PaperForm = {
  title: string
  authors: string
  journal: string
  status: PaperStatus
  impact_factor: string
  journal_partition: PaperPartition | ''
  submission_date: string
  publish_year: string
  corresponding_author: string
  doi: string
}

const EMPTY_FORM: PaperForm = {
  title: '',
  authors: '',
  journal: '',
  status: '在写',
  impact_factor: '',
  journal_partition: '',
  submission_date: '',
  publish_year: '',
  corresponding_author: '',
  doi: '',
}

function getYearFromDate(date: string | undefined): number | undefined {
  if (!date) return undefined
  const year = Number(String(date).slice(0, 4))
  return Number.isFinite(year) ? year : undefined
}

function yearToDateString(year: string): string | null {
  if (!year.trim()) return null
  const normalized = Number(year)
  if (!Number.isInteger(normalized) || normalized < 1900 || normalized > 3000) return null
  return `${normalized}-01-01`
}

function toPaper(row: any, timeline: { date: string; event: string }[]): Paper {
  return {
    id: row.id,
    title: row.title || '',
    authors: row.authors || '',
    journal: row.journal || '',
    status: (row.status as PaperStatus) || '在写',
    submission_date: row.submit_date || undefined,
    publish_year: getYearFromDate(row.publish_date || undefined),
    journal_partition: (row.journal_partition as PaperPartition) || undefined,
    corresponding_author: row.corresponding_author || undefined,
    doi: row.doi || undefined,
    impact_factor: row.impact_factor ?? undefined,
    timeline,
    created_at: row.created_at || undefined,
    updated_at: row.updated_at || undefined,
  }
}

export default function Papers() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<PaperForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PaperForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPapers() {
      setLoading(true)
      setError(null)

      const [{ data: paperRows, error: paperError }, { data: timelineRows, error: timelineError }] = await Promise.all([
        supabase.from('papers').select('*').order('created_at', { ascending: false }),
        supabase.from('paper_timeline').select('*').order('created_at', { ascending: true }),
      ])

      if (!mounted) return

      if (paperError) {
        setError(paperError.message)
        setPapers([])
        setLoading(false)
        return
      }

      if (timelineError) setError(timelineError.message)

      const timelineByPaper = new Map<string, { date: string; event: string }[]>()
      for (const row of timelineRows || []) {
        const list = timelineByPaper.get(row.paper_id) || []
        list.push({ date: row.date, event: row.event })
        timelineByPaper.set(row.paper_id, list)
      }

      setPapers((paperRows || []).map((row) => toPaper(row, timelineByPaper.get(row.id) || [])))
      setLoading(false)
    }

    loadPapers()
    return () => {
      mounted = false
    }
  }, [])

  const filtered = papers.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.authors.includes(search) &&
      !p.journal.toLowerCase().includes(search.toLowerCase()) &&
      !(p.journal_partition || '').includes(search)
    ) return false
    return true
  })

  const papersByYear = useMemo(() => {
    const groups = new Map<string, Paper[]>()
    for (const paper of filtered) {
      const yearLabel = paper.publish_year ? `${paper.publish_year}` : '未分年份'
      const list = groups.get(yearLabel) || []
      list.push(paper)
      groups.set(yearLabel, list)
    }

    return Array.from(groups.entries()).sort(([yearA], [yearB]) => {
      if (yearA === '未分年份') return 1
      if (yearB === '未分年份') return -1
      return Number(yearB) - Number(yearA)
    })
  }, [filtered])

  function renderAuthors(authors: string, correspondingAuthor?: string) {
    const correspondingSet = new Set(
      (correspondingAuthor || '')
        .split(/[，,;；]/)
        .map((name) => name.trim())
        .filter(Boolean)
    )
    if (correspondingSet.size === 0) return authors

    const authorList = authors
      .split(/[，,]/)
      .map((name) => name.trim())
      .filter(Boolean)

    if (authorList.length === 0) return authors

    return (
      <>
        {authorList.map((name, index) => (
          <span key={`${name}-${index}`}>
            <span className={correspondingSet.has(name) ? 'text-blue-600 font-semibold' : ''}>{name}</span>
            {index < authorList.length - 1 ? '， ' : ''}
          </span>
        ))}
      </>
    )
  }

  const published = papers.filter((p) => p.status === '已发表').length
  const accepted = papers.filter((p) => p.status === '已接收').length
  const inReview = papers.filter((p) => p.status === '审稿中' || p.status === '投稿中').length
  const journals = [...new Set(papers.map((p) => p.journal))]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const createdAt = new Date().toISOString()
      const today = createdAt.slice(0, 10)
      const payload = {
        title: form.title,
        authors: form.authors,
        journal: form.journal,
        status: form.status,
        impact_factor: form.impact_factor ? parseFloat(form.impact_factor) : null,
        journal_partition: form.journal_partition || null,
        submit_date: form.submission_date || null,
        publish_date: yearToDateString(form.publish_year),
        corresponding_author: form.corresponding_author.trim() || null,
        doi: form.doi.trim() || null,
      }

      const { data: paperRow, error: paperError } = await supabase
        .from('papers')
        .insert([{ ...payload, created_at: createdAt, updated_at: createdAt }])
        .select('*')
        .single()

      if (paperError) {
        setError(paperError.message)
        return
      }

      const { error: timelineError } = await supabase
        .from('paper_timeline')
        .insert([{ paper_id: paperRow.id, date: today, event: '创建记录' }])

      if (timelineError) setError(`论文已保存，但时间线写入失败: ${timelineError.message}`)

      setPapers((prev) => [toPaper(paperRow, timelineError ? [] : [{ date: today, event: '创建记录' }]), ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(paper: Paper) {
    setEditingId(paper.id)
    setEditForm({
      title: paper.title,
      authors: paper.authors,
      journal: paper.journal,
      status: paper.status,
      impact_factor: paper.impact_factor !== undefined ? String(paper.impact_factor) : '',
      journal_partition: paper.journal_partition || '',
      submission_date: paper.submission_date || '',
      publish_year: paper.publish_year !== undefined ? String(paper.publish_year) : '',
      corresponding_author: paper.corresponding_author || '',
      doi: paper.doi || '',
    })
  }

  async function handleUpdatePaper(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return

    setSavingEdit(true)
    setError(null)
    try {
      const updatedAt = new Date().toISOString()
      const payload = {
        title: editForm.title,
        authors: editForm.authors,
        journal: editForm.journal,
        status: editForm.status,
        impact_factor: editForm.impact_factor ? parseFloat(editForm.impact_factor) : null,
        journal_partition: editForm.journal_partition || null,
        submit_date: editForm.submission_date || null,
        publish_date: yearToDateString(editForm.publish_year),
        corresponding_author: editForm.corresponding_author.trim() || null,
        doi: editForm.doi.trim() || null,
        updated_at: updatedAt,
      }

      const { data: updatedRow, error: updateError } = await supabase
        .from('papers')
        .update(payload)
        .eq('id', editingId)
        .select('*')
        .single()

      if (updateError) {
        setError(updateError.message)
        return
      }

      setPapers((prev) =>
        prev.map((paper) =>
          paper.id === editingId
            ? toPaper(updatedRow, paper.timeline)
            : paper
        )
      )
      setEditingId(null)
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDeletePaper(paper: Paper) {
    const ok = confirm(`确定删除论文「${paper.title}」吗？删除后不可恢复。`)
    if (!ok) return

    setDeletingId(paper.id)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('papers').delete().eq('id', paper.id)
      if (deleteError) {
        setError(deleteError.message)
        return
      }

      setPapers((prev) => prev.filter((p) => p.id !== paper.id))
      if (expandedId === paper.id) setExpandedId(null)
      if (editingId === paper.id) setEditingId(null)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">论文管理</h1>
          <p className="text-gray-500 text-sm mt-1">共 {papers.length} 篇论文</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '添加论文'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 mb-1">已发表</p>
          <p className="text-2xl font-bold text-emerald-600">{published}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 mb-1">已接收</p>
          <p className="text-2xl font-bold text-green-600">{accepted}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 mb-1">在审/投稿</p>
          <p className="text-2xl font-bold text-amber-600">{inReview}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500 mb-1">期刊数</p>
          <p className="text-2xl font-bold text-blue-600">{journals.length}</p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4">添加论文</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">标题</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">作者</label>
                <input type="text" value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">期刊</label>
                <input type="text" value={form.journal} onChange={(e) => setForm({ ...form, journal: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PaperStatus })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">影响因子</label>
                <input type="number" step="0.1" value={form.impact_factor} onChange={(e) => setForm({ ...form, impact_factor: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">分区</label>
                <select value={form.journal_partition} onChange={(e) => setForm({ ...form, journal_partition: e.target.value as PaperPartition | '' })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">未设置</option>
                  {PARTITION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">投稿日期</label>
                <input type="date" value={form.submission_date} onChange={(e) => setForm({ ...form, submission_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">发表年份</label>
                <input type="number" min="1900" max="3000" value={form.publish_year} onChange={(e) => setForm({ ...form, publish_year: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 2026" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">DOI</label>
                <input type="text" value={form.doi} onChange={(e) => setForm({ ...form, doi: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">通讯作者</label>
              <input type="text" value={form.corresponding_author} onChange={(e) => setForm({ ...form, corresponding_author: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="可填多个，使用逗号分隔" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {saving ? '保存中...' : '保存'}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索论文标题、作者、期刊..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部状态</option>
          {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-6">
        {papersByYear.map(([year, yearPapers]) => (
          <div key={year} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{year === '未分年份' ? year : `${year} 年`}</h3>
              <span className="text-xs text-gray-400">共 {yearPapers.length} 篇</span>
            </div>
            {yearPapers.map((paper) => (
              <div key={paper.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === paper.id ? null : paper.id)}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm leading-relaxed">{paper.title}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{renderAuthors(paper.authors, paper.corresponding_author)}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{paper.journal}</span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{paper.journal_partition || '未设置分区'}</span>
                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />IF: {paper.impact_factor ?? '-'}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />发表年份: {paper.publish_year ?? '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[paper.status]}`}>
                        {paper.status}
                      </span>
                      <button
                        type="button"
                        title="编辑论文"
                        onClick={(e) => { e.stopPropagation(); openEditModal(paper) }}
                        className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-700 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="删除论文"
                        disabled={deletingId === paper.id}
                        onClick={(e) => { e.stopPropagation(); void handleDeletePaper(paper) }}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedId === paper.id && paper.timeline.length > 0 && (
                  <div className="px-5 pb-5 border-t bg-gray-50">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mt-3 mb-2">时间线</h4>
                    <div className="space-y-2">
                      {paper.timeline.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                            {i < paper.timeline.length - 1 && <div className="w-0.5 h-6 bg-green-200" />}
                          </div>
                          <div>
                            <span className="text-gray-400 text-xs">{t.date}</span>
                            <p className="text-gray-700">{t.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的论文</p>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">编辑论文</h3>
              <button type="button" onClick={() => setEditingId(null)} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdatePaper} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">标题</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">作者</label>
                  <input type="text" value={editForm.authors} onChange={(e) => setEditForm({ ...editForm, authors: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">期刊</label>
                  <input type="text" value={editForm.journal} onChange={(e) => setEditForm({ ...editForm, journal: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">状态</label>
                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as PaperStatus })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">影响因子</label>
                  <input type="number" step="0.1" value={editForm.impact_factor} onChange={(e) => setEditForm({ ...editForm, impact_factor: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">分区</label>
                  <select value={editForm.journal_partition} onChange={(e) => setEditForm({ ...editForm, journal_partition: e.target.value as PaperPartition | '' })} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">未设置</option>
                    {PARTITION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">投稿日期</label>
                  <input type="date" value={editForm.submission_date} onChange={(e) => setEditForm({ ...editForm, submission_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">发表年份</label>
                  <input type="number" min="1900" max="3000" value={editForm.publish_year} onChange={(e) => setEditForm({ ...editForm, publish_year: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 2026" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">DOI</label>
                  <input type="text" value={editForm.doi} onChange={(e) => setEditForm({ ...editForm, doi: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">通讯作者</label>
                <input type="text" value={editForm.corresponding_author} onChange={(e) => setEditForm({ ...editForm, corresponding_author: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="可填多个，使用逗号分隔" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" disabled={savingEdit} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
                  {savingEdit ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
