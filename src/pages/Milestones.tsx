import { useEffect, useMemo, useState } from 'react'
import { Flag, Search, AlertTriangle, CheckCircle, Clock, CircleDot, User, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Milestone, MilestoneStatus, MilestoneType } from '../types'

const STATUS_CONFIG: Record<MilestoneStatus, { color: string; dot: string; icon: typeof CheckCircle }> = {
  '已完成': { color: 'bg-green-50 text-green-600', dot: 'bg-green-500', icon: CheckCircle },
  '进行中': { color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500', icon: CircleDot },
  '未开始': { color: 'bg-gray-50 text-gray-500', dot: 'bg-gray-400', icon: Clock },
  '已逾期': { color: 'bg-red-50 text-red-600', dot: 'bg-red-500', icon: AlertTriangle },
}

const TYPE_ORDER: MilestoneType[] = ['开题', '中期', '预答辩', '答辩', '论文提交']

// Calculate days diff: positive = days until, negative = days overdue
function getDaysDiff(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatCountdown(dateStr: string, status: MilestoneStatus): string | null {
  if (status === '已完成') return null
  const diff = getDaysDiff(dateStr)
  if (diff > 0) return `还有 ${diff} 天`
  if (diff === 0) return '今天截止'
  return `已逾期 ${Math.abs(diff)} 天`
}

// Notes modal for student
function NotesModal({
  milestone,
  onClose,
  onSave,
}: {
  milestone: Milestone
  onClose: () => void
  onSave: (id: string, notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState(milestone.notes || '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleSave() {
    setSaving(true)
    setSaveError('')
    try {
      await onSave(milestone.id, notes)
      onClose()
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">
            {milestone.type} · 备注 / 准备进展
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-xs text-gray-500 mb-3">
          计划日期：{milestone.planned_date}
          {milestone.actual_date && <span className="ml-3">实际日期：{milestone.actual_date}</span>}
        </div>
        <textarea
          className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={5}
          placeholder="记录准备进展、待完成事项等..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {saveError && <p className="text-red-600 text-xs mt-2">{saveError}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Student-facing timeline view
function StudentTimeline({
  milestones,
  onUpdateNotes,
}: {
  milestones: Milestone[]
  onUpdateNotes: (id: string, notes: string) => Promise<void>
}) {
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  if (milestones.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Flag className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-base">暂无毕业节点，请联系导师添加</p>
      </div>
    )
  }

  const sorted = [...milestones].sort((a, b) => a.planned_date.localeCompare(b.planned_date))

  return (
    <>
      {selectedMilestone && (
        <NotesModal
          milestone={selectedMilestone}
          onClose={() => setSelectedMilestone(null)}
          onSave={async (id, notes) => {
            await onUpdateNotes(id, notes)
            setSelectedMilestone(null)
          }}
        />
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-6">我的毕业节点</h2>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-6">
            {sorted.map((m) => {
              const displayStatus = m.status
              const config = STATUS_CONFIG[displayStatus]
              const Icon = config.icon
              const countdown = formatCountdown(m.planned_date, displayStatus)
              const isOverdueItem = displayStatus !== '已完成' && getDaysDiff(m.planned_date) < 0

              return (
                <div key={m.id} className="flex items-start gap-4 relative">
                  {/* Status dot */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {/* Card */}
                  <button
                    className={`flex-1 text-left p-4 rounded-xl border transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      isOverdueItem
                        ? 'border-red-200 bg-red-50'
                        : displayStatus === '已完成'
                        ? 'border-green-200 bg-green-50'
                        : displayStatus === '进行中'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    onClick={() => setSelectedMilestone(m)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-gray-900">{m.type}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {displayStatus}
                        </span>
                      </div>
                      {countdown && (
                        <span
                          className={`text-xs font-medium flex-shrink-0 ${
                            isOverdueItem ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          {countdown}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                      <div>计划日期：{m.planned_date}</div>
                      {m.actual_date && <div>实际日期：{m.actual_date}</div>}
                    </div>
                    {m.notes ? (
                      <p className="mt-2 text-xs text-gray-600 bg-white/70 rounded p-2 border border-gray-200 line-clamp-2">
                        {m.notes}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400 italic">点击添加备注 / 准备进展</p>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default function Milestones() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'
  useEffect(() => { document.title = '毕业节点 | PWRlab' }, [])

  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [viewMode, setViewMode] = useState<'timeline' | 'student'>('student')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    async function fetchMilestones() {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('milestones')
        .select('*')
        .order('planned_date', { ascending: true, nullsFirst: false })

      if (!mounted) return

      if (fetchError) {
        setError(fetchError.message)
        setMilestones([])
      } else {
        setMilestones(
          (data || []).map((row) => ({
            id: row.id,
            student_id: row.student_id || '',
            student_name: row.student_name || '',
            type: row.type as MilestoneType,
            planned_date: row.planned_date || '',
            actual_date: row.actual_date || undefined,
            status: (row.status || '未开始') as MilestoneStatus,
            notes: row.notes || '',
            created_at: row.created_at || undefined,
          }))
        )
      }

      setLoading(false)
    }

    fetchMilestones()

    return () => {
      mounted = false
    }
  }, [])

  // Update notes for a milestone (student self-update)
  async function handleUpdateNotes(id: string, notes: string) {
    const { error: updateError } = await supabase
      .from('milestones')
      .update({ notes })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)

    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, notes } : m))
    )
  }

  const isOverdue = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    return diff > 0
  }

  const isUpcoming = (date: string) => {
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  }

  const getDisplayStatus = (milestone: Milestone): MilestoneStatus => {
    if (milestone.status === '已完成') return '已完成'
    if (isOverdue(milestone.planned_date)) return '已逾期'
    return milestone.status
  }

  const filtered = milestones.filter((m) => {
    if (isStudent && m.student_name !== user?.name) return false
    if (filterStatus && getDisplayStatus(m) !== filterStatus) return false
    if (search && !m.student_name.includes(search) && !m.type.includes(search)) return false
    return true
  })

  // Group by student (admin only)
  const byStudent = useMemo(() => {
    const groups: Record<string, Milestone[]> = {}
    filtered.forEach((m) => {
      if (!groups[m.student_name]) groups[m.student_name] = []
      groups[m.student_name].push(m)
    })
    Object.values(groups).forEach((arr) => arr.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type)))
    return groups
  }, [filtered])

  // Upcoming milestones
  const upcoming = milestones.filter((m) => {
    if (isStudent && m.student_name !== user?.name) return false
    return getDisplayStatus(m) !== '已完成' && isUpcoming(m.planned_date)
  })

  // --- Student view ---
  if (isStudent) {
    const myMilestones = milestones.filter((m) => m.student_name === user?.name)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">毕业节点</h1>
          <p className="text-gray-500 text-sm mt-1">跟踪你的关键毕业进度</p>
        </div>

        {/* Upcoming alerts for student */}
        {upcoming.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              30天内即将到来的节点
            </h3>
            <div className="flex flex-wrap gap-2">
              {upcoming.map((m) => (
                <span key={m.id} className="bg-white px-3 py-1.5 rounded-lg text-sm border border-amber-200">
                  <span className="font-medium">{m.type}</span>
                  <span className="text-amber-600 ml-2 text-xs">{m.planned_date}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="h-10 w-10 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            加载毕业节点失败: {error}
          </div>
        )}

        {!loading && !error && (
          <StudentTimeline milestones={myMilestones} onUpdateNotes={handleUpdateNotes} />
        )}
      </div>
    )
  }

  // --- Admin view ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">毕业节点</h1>
          <p className="text-gray-500 text-sm mt-1">跟踪学生关键进度节点</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('student')}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === 'student' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            按学生
          </button>
          <button onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm ${viewMode === 'timeline' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            时间线
          </button>
        </div>
      </div>

      {/* Upcoming alerts */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            30天内即将到来的节点 ({upcoming.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {upcoming.map((m) => (
              <span key={m.id} className="bg-white px-3 py-1.5 rounded-lg text-sm border border-amber-200">
                <span className="font-medium">{m.student_name}</span>
                <span className="text-gray-500 mx-1">·</span>
                <span>{m.type}</span>
                <span className="text-amber-600 ml-1 text-xs">{m.planned_date}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索学生..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部状态</option>
          {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="h-10 w-10 rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          加载毕业节点失败: {error}
        </div>
      )}

      {!loading && !error && viewMode === 'student' ? (
        <div className="space-y-4">
          {Object.entries(byStudent).map(([studentName, items]) => (
            <div key={studentName} className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-green-600" />
                {studentName}
              </h3>
              <div className="relative">
                <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {items.map((m) => {
                    const displayStatus = getDisplayStatus(m)
                    const config = STATUS_CONFIG[displayStatus]
                    const Icon = config.icon
                    const upcomingItem = displayStatus !== '已完成' && isUpcoming(m.planned_date)
                    return (
                      <div key={m.id} className={`flex items-start gap-4 relative ${upcomingItem ? 'animate-pulse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${config.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className={`flex-1 p-3 rounded-lg ${upcomingItem ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{m.type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>{displayStatus}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            计划: {m.planned_date}
                            {m.actual_date && <span className="ml-2">实际: {m.actual_date}</span>}
                          </div>
                          {m.notes && <p className="text-xs text-gray-400 mt-1">{m.notes}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="space-y-3">
            {[...filtered].sort((a, b) => a.planned_date.localeCompare(b.planned_date)).map((m) => {
              const displayStatus = getDisplayStatus(m)
              const config = STATUS_CONFIG[displayStatus]
              const Icon = config.icon
              const upcomingItem = displayStatus !== '已完成' && isUpcoming(m.planned_date)
              return (
                <div key={m.id} className={`flex items-center gap-4 p-3 rounded-lg ${upcomingItem ? 'bg-amber-50 border border-amber-200' : 'hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{m.student_name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-sm text-gray-600">{m.type}</span>
                    </div>
                    <p className="text-xs text-gray-400">{m.planned_date}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${config.color}`}>{displayStatus}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的节点</p>
        </div>
      )}
    </div>
  )
}
