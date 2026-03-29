import { useEffect, useState } from 'react'
import {
  MessageCircle, Plus, X, Send, Clock, CheckCircle, XCircle,
  Search, ChevronDown, ChevronUp, User, FolderKanban,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Question, QuestionStatus, QuestionReply, Project } from '../types'

const STATUS_STYLE: Record<QuestionStatus, { bg: string; text: string; icon: typeof Clock }> = {
  '待回复': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Clock },
  '已回复': { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: CheckCircle },
  '已关闭': { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', icon: XCircle },
}

export default function Questions() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [questions, setQuestions] = useState<Question[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<QuestionStatus | ''>('')
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [replies, setReplies] = useState<Record<string, QuestionReply[]>>({})
  const [replyText, setReplyText] = useState('')
  const [loadingReplies, setLoadingReplies] = useState<string | null>(null)

  // New question form
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newProjectId, setNewProjectId] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [qRes, pRes] = await Promise.all([
        supabase.from('questions').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('id,title,student_id,student_name'),
      ])
      if (!mounted) return
      if (qRes.error) { setError(qRes.error.message); setQuestions([]) }
      else setQuestions((qRes.data || []) as Question[])
      if (!pRes.error && pRes.data) setProjects(pRes.data as Project[])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  // Sort: 待回复 first, then by date
  const sorted = [...questions]
    .filter(q => {
      if (search && !q.title.includes(search) && !q.student_name.includes(search)) return false
      if (filterStatus && q.status !== filterStatus) return false
      if (!isAdmin && q.student_id !== user?.id) return false
      return true
    })
    .sort((a, b) => {
      if (a.status === '待回复' && b.status !== '待回复') return -1
      if (a.status !== '待回复' && b.status === '待回复') return 1
      return (b.created_at || '').localeCompare(a.created_at || '')
    })

  const loadReplies = async (questionId: string) => {
    if (expandedId === questionId) { setExpandedId(null); return }
    setExpandedId(questionId)
    setLoadingReplies(questionId)
    const { data, error: e } = await supabase.from('question_replies')
      .select('*').eq('question_id', questionId).order('created_at', { ascending: true })
    if (!e && data) setReplies(prev => ({ ...prev, [questionId]: data as QuestionReply[] }))
    setLoadingReplies(null)
  }

  const submitReply = async (questionId: string) => {
    if (!replyText.trim() || !user) return
    const { data, error: e } = await supabase.from('question_replies').insert({
      question_id: questionId, author_name: user.name, author_role: user.role, content: replyText,
    }).select().single()
    if (e) { setError(e.message); return }
    if (data) {
      setReplies(prev => ({ ...prev, [questionId]: [...(prev[questionId] || []), data as QuestionReply] }))
    }
    // If admin replies, update status to 已回复
    if (isAdmin) {
      await supabase.from('questions').update({ status: '已回复', updated_at: new Date().toISOString() }).eq('id', questionId)
      setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: '已回复' as QuestionStatus } : q))
    }
    setReplyText('')
  }

  const closeQuestion = async (questionId: string) => {
    const { error: e } = await supabase.from('questions').update({ status: '已关闭', updated_at: new Date().toISOString() }).eq('id', questionId)
    if (!e) setQuestions(prev => prev.map(q => q.id === questionId ? { ...q, status: '已关闭' as QuestionStatus } : q))
  }

  const addQuestion = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return
    const { data, error: e } = await supabase.from('questions').insert({
      student_id: user.id, student_name: user.name,
      title: newTitle, content: newContent, status: '待回复',
      project_id: newProjectId || null,
    }).select().single()
    if (e) { setError(e.message); return }
    if (data) setQuestions(prev => [data as Question, ...prev])
    setShowAdd(false); setNewTitle(''); setNewContent(''); setNewProjectId('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-green-700" /> 提问答疑
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isAdmin ? `共 ${questions.length} 个问题，${questions.filter(q => q.status === '待回复').length} 个待回复`
              : '向导师提问，获取研究指导'}
          </p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg"
            style={{ backgroundColor: '#1a3a2a' }}>
            <Plus className="w-4 h-4" /> 提问
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索问题..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as QuestionStatus | '')}
          className="text-sm border rounded-lg px-3 py-2">
          <option value="">全部状态</option>
          <option value="待回复">待回复</option>
          <option value="已回复">已回复</option>
          <option value="已关闭">已关闭</option>
        </select>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {/* Question List */}
      <div className="space-y-3">
        {sorted.map(q => {
          const style = STATUS_STYLE[q.status]
          const StatusIcon = style.icon
          const isExpanded = expandedId === q.id
          const qReplies = replies[q.id] || []
          return (
            <div key={q.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${q.status === '待回复' ? 'border-amber-300' : ''}`}>
              {/* Question header */}
              <div className="p-4 cursor-pointer" onClick={() => loadReplies(q.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {q.title}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${style.bg} ${style.text}`}>
                        <StatusIcon className="w-3 h-3" /> {q.status}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 break-words">{q.content}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{q.student_name}</span>
                  <span>{q.created_at?.slice(0, 10)}</span>
                  {q.project_id && <span className="flex items-center gap-1"><FolderKanban className="w-3 h-3" />关联课题</span>}
                </div>
              </div>

              {/* Replies */}
              {isExpanded && (
                <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
                  {loadingReplies === q.id ? (
                    <div className="text-center text-sm text-gray-400 py-2">加载中...</div>
                  ) : qReplies.length === 0 ? (
                    <div className="text-center text-sm text-gray-400 py-2">暂无回复</div>
                  ) : (
                    qReplies.map(r => (
                      <div key={r.id} className={`rounded-lg p-3 text-sm ${r.author_role === 'admin' ? 'bg-green-50 border border-green-100 ml-4' : 'bg-white border mr-4'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-700">{r.author_name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${r.author_role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                            {r.author_role === 'admin' ? '导师' : '学生'}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{r.created_at?.slice(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap break-words">{r.content}</p>
                      </div>
                    ))
                  )}
                  {/* Reply input */}
                  {q.status !== '已关闭' && (
                    <div className="flex gap-2 items-end">
                      <textarea value={expandedId === q.id ? replyText : ''} onChange={e => setReplyText(e.target.value)}
                        placeholder="输入回复..." className="flex-1 text-sm border rounded-lg px-3 py-2 min-h-[44px] max-h-[120px] resize-y"
                        rows={2}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(q.id) } }} />
                      <button onClick={() => submitReply(q.id)}
                        className="px-3 py-2 text-white rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center" style={{ backgroundColor: '#1a3a2a' }}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {/* Close button */}
                  {isAdmin && q.status !== '已关闭' && (
                    <button onClick={() => closeQuestion(q.id)}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 py-2 min-h-[44px]">
                      <XCircle className="w-3.5 h-3.5" /> 关闭问题
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{isAdmin ? '暂无学生提问' : '暂无提问，点击上方按钮提交问题'}</p>
        </div>
      )}

      {/* Add Question Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-gray-900">提交问题</h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">问题标题 *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2" placeholder="简要描述你的问题" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">详细描述 *</label>
                <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                  rows={4} className="w-full text-sm border rounded-lg px-3 py-2" placeholder="详细说明你遇到的问题..." />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">关联课题（可选）</label>
                <select value={newProjectId} onChange={e => setNewProjectId(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2">
                  <option value="">不关联</option>
                  {projects.filter(p => !isAdmin ? p.student_id === user?.id : true).map(p =>
                    <option key={p.id} value={p.id}>{p.title}</option>
                  )}
                </select>
              </div>
            </div>
            <div className="border-t px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={addQuestion} disabled={!newTitle.trim() || !newContent.trim()}
                className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#1a3a2a' }}>
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
