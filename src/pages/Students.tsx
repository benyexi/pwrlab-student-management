import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudents, createStudent, deleteStudent } from '../lib/supabase'
import type { Student, DegreeType, StudentStatus } from '../types'

const DEGREE_OPTIONS: DegreeType[] = ['硕士', '博士', '博士后']
const STATUS_OPTIONS: StudentStatus[] = ['在读', '已毕业']

const degreeColor: Record<string, string> = {
  '硕士': 'badge-blue',
  '博士': 'badge-purple',
  '博士后': 'badge-yellow',
}

const statusColor: Record<string, string> = {
  '在读': 'badge-green',
  '已毕业': 'badge-gray',
}

interface FormData {
  name: string
  student_id: string
  enrollment_year: string
  degree_type: DegreeType
  research_direction: string
  expected_graduation: string
  status: StudentStatus
  email: string
  phone: string
  notes: string
}

const emptyForm: FormData = {
  name: '',
  student_id: '',
  enrollment_year: String(new Date().getFullYear()),
  degree_type: '硕士',
  research_direction: '',
  expected_graduation: '',
  status: '在读',
  email: '',
  phone: '',
  notes: '',
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDegree, setFilterDegree] = useState<DegreeType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<StudentStatus | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    const { data } = await getStudents()
    setStudents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      s.name.includes(search) ||
      s.student_id.includes(search) ||
      s.research_direction.includes(search)
    const matchDegree = filterDegree === 'all' || s.degree_type === filterDegree
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchSearch && matchDegree && matchStatus
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    const { error } = await createStudent({
      name: form.name,
      student_id: form.student_id,
      enrollment_year: Number(form.enrollment_year),
      degree_type: form.degree_type,
      research_direction: form.research_direction,
      expected_graduation: form.expected_graduation,
      status: form.status,
      email: form.email,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
      supervisor_id: '',
    })

    if (error) {
      setFormError(error.message)
      setSaving(false)
      return
    }

    setShowModal(false)
    setForm(emptyForm)
    await load()
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除学生「${name}」吗？此操作不可撤销。`)) return
    await deleteStudent(id)
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">学生管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {students.length} 名学生</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加学生
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="搜索姓名、学号、研究方向..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:max-w-xs"
        />
        <select
          value={filterDegree}
          onChange={(e) => setFilterDegree(e.target.value as DegreeType | 'all')}
          className="input-field sm:w-32"
        >
          <option value="all">全部学位</option>
          {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as StudentStatus | 'all')}
          className="input-field sm:w-28"
        >
          <option value="all">全部状态</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          {search || filterDegree !== 'all' || filterStatus !== 'all'
            ? '没有匹配的学生'
            : '暂无学生，点击"添加学生"开始'}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">姓名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">学号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">入学年份</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">学位</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">研究方向</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">预计毕业</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/students/${s.id}`} className="font-medium text-gray-900 hover:text-primary-700">
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 font-mono text-xs">{s.student_id}</td>
                    <td className="px-4 py-3.5 text-gray-600">{s.enrollment_year}</td>
                    <td className="px-4 py-3.5">
                      <span className={degreeColor[s.degree_type] ?? 'badge-gray'}>{s.degree_type}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 max-w-[180px] truncate">{s.research_direction}</td>
                    <td className="px-4 py-3.5 text-gray-600">{s.expected_graduation}</td>
                    <td className="px-4 py-3.5">
                      <span className={statusColor[s.status] ?? 'badge-gray'}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/students/${s.id}`} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                          详情
                        </Link>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/students/${s.id}`} className="font-semibold text-gray-900">{s.name}</Link>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{s.student_id}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <span className={degreeColor[s.degree_type] ?? 'badge-gray'}>{s.degree_type}</span>
                    <span className={statusColor[s.status] ?? 'badge-gray'}>{s.status}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 truncate">{s.research_direction}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{s.enrollment_year} 级 · 预计 {s.expected_graduation}</span>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">添加学生</h2>
              <button
                onClick={() => { setShowModal(false); setFormError('') }}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学号 *</label>
                  <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    className="input-field" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">入学年份 *</label>
                  <input type="number" value={form.enrollment_year}
                    onChange={(e) => setForm({ ...form, enrollment_year: e.target.value })}
                    className="input-field" min="2000" max="2099" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学位类型 *</label>
                  <select value={form.degree_type}
                    onChange={(e) => setForm({ ...form, degree_type: e.target.value as DegreeType })}
                    className="input-field">
                    {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">研究方向 *</label>
                <input value={form.research_direction}
                  onChange={(e) => setForm({ ...form, research_direction: e.target.value })}
                  className="input-field" required placeholder="例：植物水分关系" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">预计毕业 *</label>
                  <input value={form.expected_graduation}
                    onChange={(e) => setForm({ ...form, expected_graduation: e.target.value })}
                    className="input-field" placeholder="YYYY-MM" pattern="\d{4}-\d{2}" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态 *</label>
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
                    className="input-field">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field resize-none" rows={3} />
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => { setShowModal(false); setFormError('') }} className="btn-secondary">
                取消
              </button>
              <button onClick={handleCreate} disabled={saving} className="btn-primary">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
