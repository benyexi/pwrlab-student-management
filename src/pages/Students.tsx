import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Student, DegreeType, StudentStatus } from '../types'
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react'

const EMPTY_FORM: Omit<Student, 'id' | 'created_at' | 'updated_at'> = {
  name: '', student_id: '', enrollment_year: new Date().getFullYear(),
  degree_type: '硕士', research_direction: '', expected_graduation: '',
  status: '在读', advisor: '', co_advisor: '',
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchStudents() }, [])
  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('enrollment_year', { ascending: false })
      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s =>
    s.name.includes(search) ||
    s.student_id.includes(search) ||
    s.research_direction.includes(search)
  )

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(student: Student) {
    setEditingId(student.id)
    setForm({
      name: student.name, student_id: student.student_id,
      enrollment_year: student.enrollment_year, degree_type: student.degree_type,
      research_direction: student.research_direction,
      expected_graduation: student.expected_graduation,
      status: student.status, advisor: student.advisor, co_advisor: student.co_advisor,
    })
    setShowModal(true)
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase
          .from('students').update(form).eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('students').insert([form])
        if (error) throw error
      }
      setShowModal(false)
      fetchStudents()
    } catch (err) {
      console.error('Save failed:', err)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定要删除学生「${name}」吗？`)) return
    try {
      const { error } = await supabase.from('students').delete().eq('id', id)
      if (error) throw error
      fetchStudents()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">学生管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="搜索姓名/学号/研究方向..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-white rounded-lg text-sm font-medium whitespace-nowrap"
            style={{ backgroundColor: '#1a3a2a' }}
          >
            <Plus className="w-4 h-4" /> 添加学生
          </button>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100" style={{ backgroundColor: '#f0faf3' }}>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">姓名</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">学号</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">学位</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">研究方向</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">状态</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">暂无数据</td></tr>
            ) : filtered.map(student => (
              <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{student.student_id}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700">{student.degree_type}</span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell truncate max-w-[200px]">{student.research_direction}</td>                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    student.status === '在读' ? 'bg-blue-50 text-blue-700' :
                    student.status === '已毕业' ? 'bg-gray-100 text-gray-600' :
                    'bg-yellow-50 text-yellow-700'
                  }`}>{student.status}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={e => { e.stopPropagation(); openEdit(student) }}
                      className="p-1.5 rounded-md hover:bg-green-50 text-gray-400 hover:text-green-700 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(student.id, student.name) }}
                      className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingId ? '编辑学生' : '添加学生'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-md">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>姓名 *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>学号 *</label>
                  <input required value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>入学年份</label>
                  <input type="number" value={form.enrollment_year} onChange={e => setForm({...form, enrollment_year: parseInt(e.target.value)})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>学位类型</label>
                  <select value={form.degree_type} onChange={e => setForm({...form, degree_type: e.target.value as DegreeType})} className={inputClass}>
                    <option value="硕士">硕士</option>
                    <option value="博士">博士</option>
                    <option value="博后">博后</option>
                  </select>
                </div>
              </div>              <div>
                <label className={labelClass}>研究方向</label>
                <input value={form.research_direction} onChange={e => setForm({...form, research_direction: e.target.value})} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>预计毕业时间</label>
                  <input type="date" value={form.expected_graduation} onChange={e => setForm({...form, expected_graduation: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>状态</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value as StudentStatus})} className={inputClass}>
                    <option value="在读">在读</option>
                    <option value="已毕业">已毕业</option>
                    <option value="已离组">已离组</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>导师</label>
                  <input value={form.advisor} onChange={e => setForm({...form, advisor: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>副导师</label>
                  <input value={form.co_advisor} onChange={e => setForm({...form, co_advisor: e.target.value})} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#1a3a2a' }}
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}