import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors,
  useDroppable, useDraggable, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import {
  FolderKanban, Search, Plus, X, AlertTriangle, ChevronLeft,
  ChevronRight, Clock, User, Filter, GripVertical,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Project, ProjectStage, StageHistoryEntry, Student, Site } from '../types'

const STAGES: ProjectStage[] = [
  '选题', '文献综述', '实验设计', '数据采集', '数据分析',
  '论文写作', '投稿', '审稿修改', '接收/发表',
]

const STAGE_COLORS: Record<string, string> = {
  '选题': '#ef4444', '文献综述': '#f97316', '实验设计': '#eab308',
  '数据采集': '#22c55e', '数据分析': '#06b6d4', '论文写作': '#3b82f6',
  '投稿': '#8b5cf6', '审稿修改': '#a855f7', '接收/发表': '#10b981',
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function stayColor(days: number): string {
  if (days > 90) return 'text-red-600 bg-red-50'
  if (days > 30) return 'text-orange-600 bg-orange-50'
  return 'text-gray-500 bg-gray-50'
}

function mergeUniqueById<T extends { id: string }>(...rowsList: T[][]): T[] {
  const map = new Map<string, T>()
  rowsList.flat().forEach((row) => {
    if (!map.has(row.id)) map.set(row.id, row)
  })
  return Array.from(map.values())
}

function DroppableColumn({ stage, children }: { stage: string, children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-b-lg p-2 space-y-2 min-h-[120px] bg-gray-50 transition-colors ${
        isOver ? 'ring-2 ring-inset ring-green-300 bg-green-50' : ''
      }`}
    >
      {children}
    </div>
  )
}

function DraggableCard({
  project,
  isAdmin,
  savingId,
  onOpen,
}: {
  project: Project
  isAdmin: boolean
  savingId: string | null
  onOpen: (p: Project) => void
}) {
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id: project.id,
    disabled: !isAdmin,
  })
  const days = daysSince(project.stage_entered_at)
  const daysClass = stayColor(days)

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={() => onOpen(project)}
      className={`bg-white rounded-lg border shadow-sm p-3 cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'opacity-30' : ''
      } ${savingId === project.id ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <h4 className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{project.title}</h4>
        {isAdmin && (
          <button
            type="button"
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="text-gray-300 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
            aria-label={`拖动 ${project.title}`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
        <User className="w-3 h-3" /> {project.student_name}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs px-1.5 py-0.5 rounded ${daysClass}`}>
          <Clock className="w-3 h-3 inline mr-0.5" />{days}天
        </span>
        {project.updated_at && (
          <span className="text-[10px] text-gray-400">
            {project.updated_at.slice(0, 10)}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Projects() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isMyProject = (p: Project) =>
    !isAdmin && (p.student_name === user?.name || p.student_id === user?.id)

  useEffect(() => { document.title = '研究进展 | PWRlab' }, [])

  const [projects, setProjects] = useState<Project[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [filterSite, setFilterSite] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [stageNote, setStageNote] = useState('')
  const [advisorNote, setAdvisorNote] = useState('')

  // New project form
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newStudentId, setNewStudentId] = useState('')
  const [newStudentName, setNewStudentName] = useState('')
  const [newSiteId, setNewSiteId] = useState('')
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [newEndDate, setNewEndDate] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)

      const sitePromise = supabase.from('sites').select('*').order('name_cn')

      if (isAdmin) {
        const [projRes, stuRes, siteRes] = await Promise.all([
          supabase.from('projects').select('*').order('created_at', { ascending: false }),
          supabase.from('students').select('*').order('name'),
          sitePromise,
        ])

        if (!mounted) return
        if (projRes.error) {
          setError(projRes.error.message)
          setProjects([])
        } else {
          setProjects((projRes.data || []) as Project[])
        }
        if (!stuRes.error && stuRes.data) setStudents(stuRes.data as Student[])
        if (!siteRes.error && siteRes.data) setSites(siteRes.data as Site[])
        setLoading(false)
        return
      }

      if (!user) {
        if (!mounted) return
        setProjects([])
        setStudents([])
        setSites([])
        setLoading(false)
        return
      }

      const [siteRes, projectsByAuthRes, projectsByNameRes, studentsByNameRes, studentsByLegacyIdRes] = await Promise.all([
        sitePromise,
        supabase.from('projects').select('*').eq('student_id', user.id).order('created_at', { ascending: false }),
        user.name
          ? supabase.from('projects').select('*').eq('student_name', user.name).order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        user.name
          ? supabase.from('students').select('*').eq('name', user.name).order('name')
          : Promise.resolve({ data: [], error: null }),
        supabase.from('students').select('*').eq('student_id', user.id).order('name'),
      ])

      if (!mounted) return

      const basicError =
        projectsByAuthRes.error?.message ||
        projectsByNameRes.error?.message ||
        studentsByNameRes.error?.message ||
        studentsByLegacyIdRes.error?.message

      if (basicError) setError(basicError)

      const ownStudents = mergeUniqueById<Student>(
        (studentsByNameRes.data || []) as Student[],
        (studentsByLegacyIdRes.data || []) as Student[]
      )

      let projectsByStudentIds: Project[] = []
      if (ownStudents.length > 0) {
        const ownStudentIds = ownStudents.map((s) => s.id)
        const byStudentIdsRes = await supabase
          .from('projects')
          .select('*')
          .in('student_id', ownStudentIds)
          .order('created_at', { ascending: false })

        if (byStudentIdsRes.error && !basicError) setError(byStudentIdsRes.error.message)
        projectsByStudentIds = (byStudentIdsRes.data || []) as Project[]
      }

      const visibleProjects = mergeUniqueById<Project>(
        (projectsByAuthRes.data || []) as Project[],
        (projectsByNameRes.data || []) as Project[],
        projectsByStudentIds
      ).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))

      setProjects(visibleProjects)
      setStudents(ownStudents)
      if (!siteRes.error && siteRes.data) setSites(siteRes.data as Site[])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [isAdmin, user])

  // Filtered projects
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (search && !p.title.includes(search) && !(p.student_name || '').includes(search)) return false
      if (filterStudent && p.student_id !== filterStudent) return false
      if (filterSite && p.site_id !== filterSite) return false
      if (filterYear) {
        const stu = students.find(s => s.id === p.student_id)
        if (stu && String(stu.enrollment_year) !== filterYear) return false
      }
      return true
    })
  }, [projects, search, filterStudent, filterSite, filterYear, students])

  // Group by stage
  const grouped = useMemo(() => {
    const map: Record<string, Project[]> = {}
    STAGES.forEach(s => { map[s] = [] })
    filtered.forEach(p => {
      if (map[p.stage]) map[p.stage].push(p)
    })
    return map
  }, [filtered])

  // Warning stats
  const warnings = useMemo(() => {
    const over90 = projects.filter(p => daysSince(p.stage_entered_at) > 90)
    const earlyStages: ProjectStage[] = ['选题', '文献综述', '实验设计']
    const nearGraduation = projects.filter(p => {
      if (!earlyStages.includes(p.stage)) return false
      const stu = students.find(s => s.id === p.student_id)
      if (!stu?.expected_graduation) return false
      const gradDate = new Date(stu.expected_graduation)
      const monthsLeft = (gradDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
      return monthsLeft < 12
    })
    return { over90, nearGraduation }
  }, [projects, students])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  )

  // Advance/retreat stage
  const changeStage = async (project: Project, newStage: ProjectStage) => {
    const now = new Date().toISOString()
    const history: StageHistoryEntry[] = Array.isArray(project.stage_history) ? [...project.stage_history] : []
    // Close current stage
    if (history.length > 0 && !history[history.length - 1].left_at) {
      history[history.length - 1].left_at = now
      if (stageNote) history[history.length - 1].note = stageNote
    }
    // Open new stage
    history.push({ stage: newStage, entered_at: now })

    const previous = projects
    setProjects(prev => prev.map(p => p.id === project.id
      ? { ...p, stage: newStage, stage_entered_at: now, stage_history: history, updated_at: now }
      : p
    ))
    setSavingId(project.id)
    try {
      const { error: e } = await supabase.from('projects').update({
        stage: newStage, stage_entered_at: now, stage_history: history, updated_at: now,
      }).eq('id', project.id)
      if (e) { setProjects(previous); setError(e.message) }
      else if (selectedProject?.id === project.id) {
        setSelectedProject({ ...project, stage: newStage, stage_entered_at: now, stage_history: history })
      }
    } finally { setSavingId(null); setStageNote('') }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const project = projects.find((item) => item.id === String(event.active.id)) || null
    setActiveProject(project)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveProject(null)

    if (!over) return

    const project = projects.find((item) => item.id === String(active.id))
    const nextStage = String(over.id)

    if (!project) return
    if (!STAGES.includes(nextStage as ProjectStage)) return
    if (project.stage === nextStage) return

    await changeStage(project, nextStage as ProjectStage)
  }

  const saveAdvisorNote = async () => {
    if (!selectedProject) return
    const { error: e } = await supabase.from('projects').update({
      advisor_notes: advisorNote, updated_at: new Date().toISOString(),
    }).eq('id', selectedProject.id)
    if (!e) {
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, advisor_notes: advisorNote } : p))
      setSelectedProject({ ...selectedProject, advisor_notes: advisorNote })
    }
  }

  const addProject = async () => {
    if (!newTitle || !newStudentId) return
    const now = new Date().toISOString()
    const initialHistory: StageHistoryEntry[] = [{ stage: '选题', entered_at: now }]
    const { data, error: e } = await supabase.from('projects').insert({
      title: newTitle, description: newDesc || null,
      student_id: newStudentId, student_name: newStudentName,
      stage: '选题', start_date: newStartDate,
      expected_end_date: newEndDate || null,
      stage_entered_at: now, stage_history: initialHistory,
      site_id: newSiteId || null,
    }).select().single()
    if (e) { setError(e.message); return }
    if (data) setProjects(prev => [data as Project, ...prev])
    setShowAddForm(false)
    setNewTitle(''); setNewDesc(''); setNewStudentId(''); setNewStudentName('')
    setNewSiteId(''); setNewStartDate(new Date().toISOString().slice(0, 10)); setNewEndDate('')
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
            <FolderKanban className="w-6 h-6 text-green-700" /> 研究进展
          </h1>
          <p className="text-gray-500 text-sm mt-1">共 {projects.length} 个课题</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" /> 筛选
          </button>
          {isAdmin && (
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#1a3a2a' }}>
              <Plus className="w-4 h-4" /> 新课题
            </button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索课题或学生..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full" />
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
            <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5">
              <option value="">全部学生</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterSite} onChange={e => setFilterSite(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5">
              <option value="">全部站点</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
              className="text-sm border rounded-lg px-3 py-1.5">
              <option value="">全部年级</option>
              {[...new Set(students.map(s => s.enrollment_year))].sort().map(y =>
                <option key={y} value={String(y)}>{y}级</option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Warning Panel */}
      {(warnings.over90.length > 0 || warnings.nearGraduation.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-800 font-semibold mb-2">
            <AlertTriangle className="w-5 h-5" /> 预警提醒
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {warnings.over90.length > 0 && (
              <span className="text-red-700">
                🔴 {warnings.over90.length} 个课题停留超90天
              </span>
            )}
            {warnings.nearGraduation.length > 0 && (
              <span className="text-orange-700">
                🟠 {warnings.nearGraduation.length} 位学生临近毕业但课题在早期阶段
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="w-16 h-16 text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-1">暂无课题</h3>
          <p className="text-sm text-gray-300 mb-6">还没有任何研究课题记录</p>
          {isAdmin && (
            <button onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-lg"
              style={{ backgroundColor: '#1a3a2a' }}>
              <Plus className="w-4 h-4" /> 添加第一个课题
            </button>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {projects.length > 0 && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4 -mx-4 px-4 -webkit-overflow-scrolling-touch">
            <div className="flex gap-3" style={{ minWidth: `${STAGES.length * 200}px` }}>
              {STAGES.map(stage => {
                const cards = grouped[stage] || []
                return (
                  <div key={stage} className="flex-1 min-w-[200px]">
                    <div className="rounded-t-lg px-3 py-2 text-white text-sm font-medium flex items-center justify-between"
                      style={{ backgroundColor: STAGE_COLORS[stage] }}>
                      <span>{stage}</span>
                      <span className="bg-white/30 rounded-full px-2 py-0.5 text-xs">{cards.length}</span>
                    </div>

                    <DroppableColumn stage={stage}>
                      {cards.length === 0 && (
                        <div className="text-center text-xs text-gray-300 py-6">暂无</div>
                      )}
                      {cards.map(project => (
                        <DraggableCard
                          key={project.id}
                          project={project}
                          isAdmin={isAdmin || isMyProject(project)}
                          savingId={savingId}
                          onOpen={(item) => {
                            setSelectedProject(item)
                            setAdvisorNote(item.advisor_notes || '')
                          }}
                        />
                      ))}
                    </DroppableColumn>
                  </div>
                )
              })}
            </div>
          </div>

          <DragOverlay>
            {activeProject ? (
              <div className="w-[200px] rounded-lg border bg-white p-3 shadow-lg">
                <div className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
                  {activeProject.title}
                </div>
                <div className="mt-1 text-xs text-gray-500">{activeProject.student_name}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-gray-900 text-lg break-words pr-2">{selectedProject.title}</h3>
              <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">学生</span><p className="font-medium">{selectedProject.student_name}</p></div>
                <div><span className="text-gray-400">当前阶段</span>
                  <p className="font-medium" style={{ color: STAGE_COLORS[selectedProject.stage] }}>{selectedProject.stage}</p></div>
                <div><span className="text-gray-400">开始日期</span><p>{selectedProject.start_date}</p></div>
                <div><span className="text-gray-400">预计完成</span><p>{selectedProject.expected_end_date || '—'}</p></div>
              </div>
              {selectedProject.description && (
                <div className="text-sm"><span className="text-gray-400">描述</span><p className="mt-1">{selectedProject.description}</p></div>
              )}

              {/* Stage controls */}
              {(isAdmin || isMyProject(selectedProject)) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">阶段推进</p>
                  <input type="text" placeholder="阶段变更备注（可选）..." value={stageNote} onChange={e => setStageNote(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2" />
                  <div className="flex gap-2">
                    {STAGES.indexOf(selectedProject.stage) > 0 && (
                      <button onClick={() => changeStage(selectedProject, STAGES[STAGES.indexOf(selectedProject.stage) - 1])}
                        disabled={savingId === selectedProject.id}
                        className="flex items-center gap-1 px-3 min-h-[44px] text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">
                        <ChevronLeft className="w-4 h-4" /> 回退
                      </button>
                    )}
                    {STAGES.indexOf(selectedProject.stage) < STAGES.length - 1 && (
                      <button onClick={() => changeStage(selectedProject, STAGES[STAGES.indexOf(selectedProject.stage) + 1])}
                        disabled={savingId === selectedProject.id}
                        className="flex items-center gap-1 px-3 min-h-[44px] text-sm text-white rounded-lg disabled:opacity-50"
                        style={{ backgroundColor: '#1a3a2a' }}>
                        推进 <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {Array.isArray(selectedProject.stage_history) && selectedProject.stage_history.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">阶段时间线</p>
                  <div className="space-y-2">
                    {selectedProject.stage_history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: STAGE_COLORS[h.stage] || '#9ca3af' }} />
                        <div>
                          <span className="font-medium">{h.stage}</span>
                          <span className="text-gray-400 ml-2">{h.entered_at?.slice(0, 10)}</span>
                          {h.left_at && <span className="text-gray-400"> → {h.left_at.slice(0, 10)}</span>}
                          {h.note && <p className="text-gray-500 text-xs mt-0.5">{h.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advisor notes */}
              {isAdmin && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">导师批注</p>
                  <textarea value={advisorNote} onChange={e => setAdvisorNote(e.target.value)}
                    rows={3} className="w-full text-sm border rounded-lg px-3 py-2" placeholder="添加批注..." />
                  <button onClick={saveAdvisorNote}
                    className="mt-2 px-4 py-1.5 text-sm text-white rounded-lg" style={{ backgroundColor: '#1a3a2a' }}>
                    保存批注
                  </button>
                </div>
              )}
              {!isAdmin && selectedProject.advisor_notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">导师批注</p>
                  <p className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">{selectedProject.advisor_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between z-10">
              <h3 className="font-bold text-gray-900">添加新课题</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-gray-100 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">课题名称 *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">课题描述</label>
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  rows={2} className="w-full text-sm border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">学生 *</label>
                <select value={newStudentId} onChange={e => {
                  setNewStudentId(e.target.value)
                  const s = students.find(s => s.id === e.target.value)
                  setNewStudentName(s?.name || '')
                }} className="w-full text-sm border rounded-lg px-3 py-2">
                  <option value="">选择学生</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">关联站点</label>
                <select value={newSiteId} onChange={e => setNewSiteId(e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2">
                  <option value="">无</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">开始日期</label>
                  <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">预计完成</label>
                  <input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)}
                    className="w-full text-sm border rounded-lg px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="border-t px-5 py-3 flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">取消</button>
              <button onClick={addProject} disabled={!newTitle || !newStudentId}
                className="px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#1a3a2a' }}>
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
