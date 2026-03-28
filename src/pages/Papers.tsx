import { useState } from 'react'
import { FileText, Search, Plus, X, Clock, BarChart3, BookOpen } from 'lucide-react'
import { DEMO_PAPERS } from '../data/demo'
import type { Paper, PaperStatus } from '../types'

const STATUS_COLORS: Record<PaperStatus, string> = {
  '在写': 'bg-gray-100 text-gray-600',
  '投稿中': 'bg-blue-50 text-blue-600',
  '审稿中': 'bg-amber-50 text-amber-600',
  '修改中': 'bg-orange-50 text-orange-600',
  '已接收': 'bg-green-50 text-green-600',
  '已发表': 'bg-emerald-50 text-emerald-700',
}

export default function Papers() {
  const [papers, setPapers] = useState<Paper[]>(DEMO_PAPERS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', authors: '', journal: '', status: '在写' as PaperStatus, impact_factor: '' })

  const filtered = papers.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.authors.includes(search) && !p.journal.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Stats
  const published = papers.filter((p) => p.status === '已发表').length
  const accepted = papers.filter((p) => p.status === '已接收').length
  const inReview = papers.filter((p) => p.status === '审稿中' || p.status === '投稿中').length
  const journals = [...new Set(papers.map((p) => p.journal))]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newPaper: Paper = {
      id: `pa_${Date.now()}`,
      title: form.title,
      authors: form.authors,
      journal: form.journal,
      status: form.status,
      impact_factor: form.impact_factor ? parseFloat(form.impact_factor) : undefined,
      timeline: [{ date: new Date().toISOString().slice(0, 10), event: '创建记录' }],
    }
    setPapers((prev) => [newPaper, ...prev])
    setShowForm(false)
    setForm({ title: '', authors: '', journal: '', status: '在写', impact_factor: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">论文管理</h1>
          <p className="text-gray-500 text-sm mt-1">共 {papers.length} 篇论文</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '添加论文'}
        </button>
      </div>

      {/* Stats */}
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

      {/* Form */}
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
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">保存</button>
          </form>
        </div>
      )}

      {/* Filters */}
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

      {/* Paper List */}
      <div className="space-y-3">
        {filtered.map((paper) => (
          <div key={paper.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-5 cursor-pointer" onClick={() => setExpandedId(expandedId === paper.id ? null : paper.id)}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm leading-relaxed">{paper.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{paper.authors}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{paper.journal}</span>
                    {paper.impact_factor && <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />IF: {paper.impact_factor}</span>}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[paper.status]}`}>
                  {paper.status}
                </span>
              </div>
            </div>

            {/* Timeline */}
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的论文</p>
        </div>
      )}
    </div>
  )
}
