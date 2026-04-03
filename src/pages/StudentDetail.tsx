import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getStudent, updateStudent, deleteStudent } from '../lib/supabase'
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

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Student>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = student ? `${student.name} | PWRlab` : '学生详情 | PWRlab'
  }, [student])

  useEffect(() => {
    if (!id) return
    getStudent(id).then(({ data, error }) => {
      if (error || !data) {
        navigate('/students')
        return
      }
      setStudent(data)
      setForm(data)
      setLoading(false)
    })
  }, [id, navigate])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setError('')
    const { data, error: err } = await updateStudent(id, form)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    setStudent(data)
    setEditing(false)
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!student) return
    if (!confirm(`确定要删除学生「${student.name}」吗？此操作不可撤销。`)) return
    await deleteStudent(student.id)
    navigate('/students')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/students" className="hover:text-primary-700">学生管理</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{student.name}</span>
      </div>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xl">
              {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-sm text-gray-500 font-mono mt-0.5">{student.student_id}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={degreeColor[student.degree_type] ?? 'badge-gray'}>{student.degree_type}</span>
                <span className={statusColor[student.status] ?? 'badge-gray'}>{student.status}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); setForm(student) }} className="btn-secondary text-xs px-3 py-1.5">
                  取消
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs px-3 py-1.5">
                  {saving ? '保存中...' : '保存'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="btn-secondary text-xs px-3 py-1.5">
                  编辑
                </button>
                <button onClick={handleDelete} className="btn-danger text-xs px-3 py-1.5">
                  删除
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Details card */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">基本信息</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="入学年份" editing={editing}>
            {editing ? (
              <input type="number" value={form.enrollment_year ?? ''}
                onChange={(e) => setForm({ ...form, enrollment_year: Number(e.target.value) })}
                className="input-field" />
            ) : (
              <span>{student.enrollment_year} 年</span>
            )}
          </Field>

          <Field label="学位类型" editing={editing}>
            {editing ? (
              <select value={form.degree_type ?? ''}
                onChange={(e) => setForm({ ...form, degree_type: e.target.value as DegreeType })}
                className="input-field">
                {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <span>{student.degree_type}</span>
            )}
          </Field>

          <Field label="研究方向" editing={editing} className="sm:col-span-2">
            {editing ? (
              <input value={form.research_direction ?? ''}
                onChange={(e) => setForm({ ...form, research_direction: e.target.value })}
                className="input-field" />
            ) : (
              <span>{student.research_direction}</span>
            )}
          </Field>

          <Field label="预计毕业时间" editing={editing}>
            {editing ? (
              <input value={form.expected_graduation ?? ''}
                onChange={(e) => setForm({ ...form, expected_graduation: e.target.value })}
                className="input-field" placeholder="YYYY-MM" />
            ) : (
              <span>{student.expected_graduation}</span>
            )}
          </Field>

          <Field label="当前状态" editing={editing}>
            {editing ? (
              <select value={form.status ?? ''}
                onChange={(e) => setForm({ ...form, status: e.target.value as StudentStatus })}
                className="input-field">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <span>{student.status}</span>
            )}
          </Field>
        </div>
      </div>

      {/* Contact card */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">联系方式</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="邮箱" editing={editing}>
            {editing ? (
              <input type="email" value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field" />
            ) : (
              <a href={`mailto:${student.email}`} className="text-primary-600 hover:underline">{student.email}</a>
            )}
          </Field>

          <Field label="手机号" editing={editing}>
            {editing ? (
              <input value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field" />
            ) : (
              <span>{student.phone ?? '—'}</span>
            )}
          </Field>
        </div>
      </div>

      {/* Notes card */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">备注</h2>
        {editing ? (
          <textarea value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="input-field resize-none w-full" rows={4} />
        ) : (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {student.notes || <span className="text-gray-400">暂无备注</span>}
          </p>
        )}
      </div>

      {/* Meta */}
      <p className="text-xs text-gray-400 text-center pb-2">
        {student.created_at && `创建于 ${new Date(student.created_at).toLocaleDateString('zh-CN')}`}
        {student.updated_at && student.updated_at !== student.created_at &&
          ` · 更新于 ${new Date(student.updated_at).toLocaleDateString('zh-CN')}`}
      </p>
    </div>
  )
}

function Field({
  label,
  editing,
  children,
  className = '',
}: {
  label: string
  editing: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      {editing ? children : <div className="text-sm text-gray-900">{children}</div>}
    </div>
  )
}
