import { useState } from 'react'
import { FolderKanban, Search, ChevronRight, User } from 'lucide-react'
import { DEMO_PROJECTS } from '../data/demo'
import type { Project, ProjectStage } from '../types'

const STAGES: ProjectStage[] = ['选题', '文献综述', '实验设计', '数据采集', '数据分析', '论文写作', '投稿', '审稿修改', '接收/发表']
const STAGE_COLORS: Record<number, string> = {
  0: '#ef4444', 1: '#f97316', 2: '#eab308', 3: '#22c55e', 4: '#06b6d4', 5: '#3b82f6', 6: '#8b5cf6', 7: '#a855f7', 8: '#10b981',
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(DEMO_PROJECTS)
  const [search, setSearch] = useState('')

  const filtered = projects.filter(
    (p) => p.title.includes(search) || p.student_name.includes(search)
  )

  const getStageIndex = (stage: ProjectStage) => STAGES.indexOf(stage)
  const getProgress = (stage: ProjectStage) => ((getStageIndex(stage) + 1) / STAGES.length) * 100

  const handleStageClick = (projectId: string, newStage: ProjectStage) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, stage: newStage } : p))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">研究进展</h1>
          <p className="text-gray-500 text-sm mt-1">共 {projects.length} 个课题</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索课题或学生..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full sm:w-64" />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((project) => {
          const stageIdx = getStageIndex(project.stage)
          const progress = getProgress(project.stage)
          return (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-gray-500 mt-1 ml-6">{project.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                  <User className="w-3.5 h-3.5" />
                  {project.student_name}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>当前阶段: <span className="font-medium text-gray-700">{project.stage}</span></span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: STAGE_COLORS[stageIdx] || '#10b981' }}
                  />
                </div>
              </div>

              {/* Stage pills */}
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((stage, idx) => {
                  const isActive = idx === stageIdx
                  const isPast = idx < stageIdx
                  return (
                    <button
                      key={stage}
                      onClick={() => handleStageClick(project.id, stage)}
                      className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-xs transition-all ${
                        isActive
                          ? 'text-white font-medium shadow-sm'
                          : isPast
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                      style={isActive ? { backgroundColor: STAGE_COLORS[idx] } : undefined}
                    >
                      {isPast && <ChevronRight className="w-3 h-3" />}
                      {stage}
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span>开始: {project.start_date}</span>
                {project.expected_end_date && <span>预计完成: {project.expected_end_date}</span>}
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的课题</p>
        </div>
      )}
    </div>
  )
}
