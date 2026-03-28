import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Student } from '../types'
import { Users, GraduationCap, UserCheck, UserX, Calendar } from 'lucide-react'

const DEMO_STUDENTS: Student[] = [
  { id: 'stu1', name: '张三', student_id: '2023001', enrollment_year: 2023, degree_type: '博士', research_direction: '人工林蒸腾耗水', expected_graduation: '2026-06', status: '在读', advisor: '席本野', co_advisor: '关锡明' },
  { id: 'stu2', name: '李四', student_id: '2024001', enrollment_year: 2024, degree_type: '博士', research_direction: '稳定同位素水分来源', expected_graduation: '2027-06', status: '在读', advisor: '席本野', co_advisor: '' },
  { id: 'stu3', name: '王五', student_id: '2022001', enrollment_year: 2022, degree_type: '博士', research_direction: '人工林生产力模拟', expected_graduation: '2025-12', status: '在读', advisor: '席本野', co_advisor: '关锡明' },
  { id: 'stu4', name: '赵六', student_id: '2025001', enrollment_year: 2025, degree_type: '硕士', research_direction: '干旱区人工林水文', expected_graduation: '2028-06', status: '在读', advisor: '席本野', co_advisor: '' },
  { id: 'stu5', name: '钱七', student_id: '2025002', enrollment_year: 2025, degree_type: '硕士', research_direction: '云杉林蒸散', expected_graduation: '2028-06', status: '在读', advisor: '席本野', co_advisor: '' },
  { id: 'stu6', name: '孙八', student_id: '2020001', enrollment_year: 2020, degree_type: '博士', research_direction: '杨树水力学特性', expected_graduation: '2024-06', status: '已毕业', advisor: '席本野', co_advisor: '' },
  { id: 'stu7', name: '周九', student_id: '2021001', enrollment_year: 2021, degree_type: '硕士', research_direction: '杨树抗旱机理', expected_graduation: '2024-06', status: '已毕业', advisor: '席本野', co_advisor: '关锡明' },
  { id: 'stu8', name: '吴十', student_id: '2023002', enrollment_year: 2023, degree_type: '博后', research_direction: '人工林碳水耦合', expected_graduation: '2025-09', status: '已离组', advisor: '席本野', co_advisor: '' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const students = DEMO_STUDENTS
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h2>
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
          {students.map((student) => (
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
          ))}
        </div>
      </div>
    </div>
  )
}
