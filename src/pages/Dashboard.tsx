import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Student } from '../types'
import { Users, GraduationCap, UserCheck, UserX, Calendar, RefreshCw } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setStudents(data as Student[])
    setLoading(false)
  }

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === '在读').length,
    graduated: students.filter(s => s.status === '已毕业').length,
    left: students.filter(s => s.status === '已离组').length,
  }

  const statCards = [
    { label: '学生总数', value: stats.total, icon: Users, color: '#1a3a2a' },
    { label: '在读', value: stats.active, icon: UserCheck, color: '#16a34a' },
    { label: '已毕业', value: stats.graduated, icon: GraduationCap, color: '#2563eb' },
    { label: '已离组', value: stats.left, icon: UserX, color: '#9ca3af' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">仪表盘</h2>
        <button onClick={fetchStudents} className="text-sm text-gray-500 hover:text-green-700 flex items-center gap-1">
          <RefreshCw className="w-4 h-4" /> 刷新
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/students')}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <card.icon className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <div className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-700">学生列表</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {students.length === 0 ? (
            <div className="p-8 text-center text-gray-400">暂无学生数据，请在「学生管理」页面添加</div>
          ) : (
            students.map((student) => (
              <div key={student.id} className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/students/${student.id}`)}>
                <div>
                  <span className="font-medium text-gray-800">{student.name}</span>
                  <span className="ml-2 text-sm text-gray-400">{student.student_id}</span>
                  <span className="ml-3 text-sm text-gray-400">{student.research_direction}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">{student.degree_type}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    student.status === '在读' ? 'bg-blue-50 text-blue-700' :
                    student.status === '已毕业' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-50 text-yellow-700'
                  }`}>{student.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
