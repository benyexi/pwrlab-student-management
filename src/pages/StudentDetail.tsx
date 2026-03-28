import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Student } from '../types'
import { ArrowLeft, User, BookOpen, Calendar, GraduationCap } from 'lucide-react'

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchStudent(id)
  }, [id])

  async function fetchStudent(studentId: string) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()
      if (error) throw error
      setStudent(data)
    } catch (err) {
      console.error('Failed to fetch student:', err)
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">未找到该学生</p>
        <button onClick={() => navigate('/students')}
          className="mt-4 text-green-700 hover:underline">返回列表</button>
      </div>
    )
  }

  const statusColor = student.status === '在读' ? 'bg-blue-50 text-blue-700 border-blue-200' :
    student.status === '已毕业' ? 'bg-gray-100 text-gray-600 border-gray-200' :
    'bg-yellow-50 text-yellow-700 border-yellow-200'

  const infoItems = [
    { label: '学号', value: student.student_id },
    { label: '入学年份', value: String(student.enrollment_year) },
    { label: '学位类型', value: student.degree_type },
    { label: '研究方向', value: student.research_direction || '—' },
    { label: '预计毕业', value: student.expected_graduation || '—' },
    { label: '状态', value: student.status },
    { label: '导师', value: student.advisor || '—' },
    { label: '副导师', value: student.co_advisor || '—' },
  ]
  return (
    <div>
      {/* Back button */}
      <button onClick={() => navigate('/students')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回学生列表
      </button>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
            style={{ backgroundColor: '#1a3a2a' }}>
            {student.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{student.student_id}</span>
              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{student.degree_type}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{student.enrollment_year}级</span>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm border ${statusColor}`}>
            {student.status}
          </span>
        </div>
        {/* Detail info grid */}
        <div className="px-6 py-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> 详细信息
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {infoItems.map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">{item.label}</div>
                <div className="text-sm font-medium text-gray-800">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Placeholder for future milestone/notes sections */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">培养节点</h3>
        <p className="text-gray-400 text-sm">功能开发中，敬请期待 Phase 2 ...</p>
      </div>
    </div>
  )
}