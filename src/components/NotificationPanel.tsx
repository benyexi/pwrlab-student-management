import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ClipboardList,
  MessageCircle,
  Flag,
  X,
  Loader2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface NotificationItem {
  id: string
  type: 'report' | 'question' | 'milestone'
  title: string
  subtitle: string
  time: string
  link: string
}

export default function NotificationPanel() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [counts, setCounts] = useState({ reports: 0, questions: 0, milestones: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const totalCount = counts.reports + counts.questions + counts.milestones

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Fetch counts on mount + every 60s
  useEffect(() => {
    fetchCounts()
    const interval = setInterval(fetchCounts, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchCounts() {
    const [reportsRes, questionsRes, milestonesRes] = await Promise.all([
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .or('advisor_comment.is.null,advisor_comment.eq.'),
      supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('status', '待回复'),
      supabase
        .from('milestones')
        .select('id,planned_date', { count: 'exact' })
        .in('status', ['未开始', '进行中'])
        .gte('planned_date', new Date().toISOString().slice(0, 10))
        .lte('planned_date', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)),
    ])

    setCounts({
      reports: reportsRes.count || 0,
      questions: questionsRes.count || 0,
      milestones: milestonesRes.count || 0,
    })
  }

  async function fetchItems() {
    setLoading(true)
    const notifs: NotificationItem[] = []

    // Uncommented reports (no advisor_comment)
    const { data: reports } = await supabase
      .from('reports')
      .select('id, student_name, week_start, week_end, student_id, created_at')
      .or('advisor_comment.is.null,advisor_comment.eq.')
      .order('created_at', { ascending: false })
      .limit(10)

    if (reports) {
      for (const r of reports) {
        notifs.push({
          id: `report-${r.id}`,
          type: 'report',
          title: `${r.student_name ?? '未知'} 的周报待批注`,
          subtitle: `${r.week_start} ~ ${r.week_end}`,
          time: r.created_at?.slice(0, 10) || '',
          link: `/reports/${r.student_id}`,
        })
      }
    }

    // Pending questions
    const { data: questions } = await supabase
      .from('questions')
      .select('id, student_name, title, created_at')
      .eq('status', '待回复')
      .order('created_at', { ascending: false })
      .limit(10)

    if (questions) {
      for (const q of questions) {
        notifs.push({
          id: `question-${q.id}`,
          type: 'question',
          title: `${q.student_name} 提问待回复`,
          subtitle: q.title || '',
          time: q.created_at?.slice(0, 10) || '',
          link: '/questions',
        })
      }
    }

    // Milestones within 30 days
    const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
    const today = new Date().toISOString().slice(0, 10)
    const { data: milestones } = await supabase
      .from('milestones')
      .select('id, student_name, type, planned_date')
      .in('status', ['未开始', '进行中'])
      .gte('planned_date', today)
      .lte('planned_date', thirtyDaysLater)
      .order('planned_date', { ascending: true })
      .limit(10)

    if (milestones) {
      for (const m of milestones) {
        const daysLeft = Math.ceil(
          (new Date(m.planned_date).getTime() - Date.now()) / 86400000
        )
        notifs.push({
          id: `milestone-${m.id}`,
          type: 'milestone',
          title: `${m.student_name} - ${m.type}`,
          subtitle: `计划日期 ${m.planned_date}（${daysLeft}天后）`,
          time: m.planned_date,
          link: '/milestones',
        })
      }
    }

    setItems(notifs)
    setLoading(false)
  }

  function handleToggle() {
    const next = !open
    setOpen(next)
    if (next) fetchItems()
  }

  function handleItemClick(link: string) {
    setOpen(false)
    navigate(link)
  }

  const iconMap = {
    report: ClipboardList,
    question: MessageCircle,
    milestone: Flag,
  }

  const colorMap = {
    report: 'text-blue-600 bg-blue-50',
    question: 'text-amber-600 bg-amber-50',
    milestone: 'text-red-600 bg-red-50',
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        title="通知"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">通知中心</h3>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 text-xs">
                {counts.reports > 0 && (
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
                    周报 {counts.reports}
                  </span>
                )}
                {counts.questions > 0 && (
                  <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                    提问 {counts.questions}
                  </span>
                )}
                {counts.milestones > 0 && (
                  <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                    节点 {counts.milestones}
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                暂无待处理通知
              </div>
            ) : (
              items.map((item) => {
                const Icon = iconMap[item.type]
                const colors = colorMap[item.type]
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.link)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${colors}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 break-words">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 break-words">
                        {item.subtitle}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                      {item.time}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
