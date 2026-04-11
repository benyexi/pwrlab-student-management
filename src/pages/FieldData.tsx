import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Droplets, TreePine, Ruler, CloudRain, Leaf, Search, Plus, X,
  Upload, Download, Camera, AlertCircle, CheckCircle, BarChart3,
  MapPin, Users, FileImage,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { FieldDataType } from '../types'
import type { User } from '../types'

// ─────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────
type ObsRow = {
  id: string; site_id: string; student_name: string | null
  submitted_by: string | null; date: string; data_type: FieldDataType
  value: number | null; unit: string | null; dbh: number | null
  tree_height: number | null; irrigation_amount: number | null
  phenology_stage: string | null; notes: string | null; created_at: string | null
}

type FileDbRow = {
  id: string; file_name: string; storage_path: string | null
  file_type: string; file_size: number; observation_id: string | null
  student_name: string; upload_date: string
}

type Observation = {
  id: string; site_id: string; site_name: string
  student_name: string; submitted_by: string | null
  date: string; data_type: FieldDataType
  value?: number; unit?: string; dbh?: number; tree_height?: number
  irrigation_amount?: number; phenology_stage?: string
  notes?: string; created_at?: string; file_count?: number
}

type Site = { id: string; name_cn: string }

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const DATA_TYPE_CONFIG: Record<FieldDataType, { label: string; icon: typeof Droplets; color: string }> = {
  soil_moisture: { label: '土壤含水量', icon: Droplets,   color: 'bg-blue-50 text-blue-600' },
  sap_flow:      { label: '树干液流',   icon: TreePine,   color: 'bg-green-50 text-green-600' },
  growth:        { label: '树木生长量', icon: Ruler,      color: 'bg-amber-50 text-amber-600' },
  irrigation:    { label: '灌溉记录',   icon: CloudRain,  color: 'bg-cyan-50 text-cyan-600' },
  phenology:     { label: '物候观测',   icon: Leaf,       color: 'bg-purple-50 text-purple-600' },
  other:         { label: '其他',       icon: Leaf,       color: 'bg-slate-50 text-slate-600' },
}

const EMPTY_FORM = {
  site_id: '', date: new Date().toISOString().slice(0, 10),
  data_type: 'soil_moisture' as FieldDataType,
  value: '', unit: '', dbh: '', tree_height: '',
  irrigation_amount: '', phenology_stage: '', notes: '',
}

const DRAFT_KEY = 'pwrlab_field_draft'
const ACCEPTED_TYPES = 'image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function mapObs(row: ObsRow, siteName: string, fileCount = 0): Observation {
  return {
    id: row.id, site_id: row.site_id, site_name: siteName,
    student_name: row.student_name || '未命名',
    submitted_by: row.submitted_by || null,
    date: row.date, data_type: row.data_type,
    value: row.value ?? undefined, unit: row.unit || undefined,
    dbh: row.dbh ?? undefined, tree_height: row.tree_height ?? undefined,
    irrigation_amount: row.irrigation_amount ?? undefined,
    phenology_stage: row.phenology_stage || undefined,
    notes: row.notes || undefined, created_at: row.created_at || undefined,
    file_count: fileCount,
  }
}

function DataBadge({ dt }: { dt: FieldDataType }) {
  const cfg = DATA_TYPE_CONFIG[dt]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}

function dataValue(o: Observation) {
  if (o.value !== undefined) return `${o.value}${o.unit ? ' ' + o.unit : ''}`
  if (o.dbh !== undefined)   return `DBH ${o.dbh}cm${o.tree_height ? ', H ' + o.tree_height + 'm' : ''}`
  if (o.irrigation_amount !== undefined) return `${o.irrigation_amount} mm`
  if (o.phenology_stage)     return o.phenology_stage
  return '—'
}

// ─────────────────────────────────────────────
// File upload to Supabase Storage
// ─────────────────────────────────────────────
async function uploadFile(
  file: File,
  observationId: string,
  studentName: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  const datePath = new Date().toISOString().slice(0, 7)
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${studentName}/${datePath}/${observationId}/${Date.now()}-${safe}`

  onProgress(10)
  const { error } = await supabase.storage
    .from('field-observations')
    .upload(path, file, { upsert: false })
  if (error) throw error
  onProgress(100)
  return path
}

// ─────────────────────────────────────────────
// StudentView
// ─────────────────────────────────────────────
function StudentView({ user }: { user: User }) {
  const [sites, setSites] = useState<Site[]>([])
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<typeof EMPTY_FORM>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      return saved ? { ...EMPTY_FORM, ...JSON.parse(saved) } : EMPTY_FORM
    } catch { return EMPTY_FORM }
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Save draft to localStorage on every form change
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)) } catch { /* quota */ }
  }, [form])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [{ data: siteData }, { data: obsData }] = await Promise.all([
        supabase.from('sites').select('id,name_cn').order('name_cn'),
        supabase.from('field_observations')
          .select('id,site_id,student_name,submitted_by,date,data_type,value,unit,dbh,tree_height,irrigation_amount,phenology_stage,notes,created_at')
          .or(`submitted_by.eq.${user.id},student_name.eq.${user.name}`)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])
      if (!mounted) return
      const nextSites = (siteData || []) as Site[]
      const nameMap = new Map(nextSites.map(s => [s.id, s.name_cn]))
      setSites(nextSites)
      setObservations((obsData || []).map(r => mapObs(r as ObsRow, nameMap.get(r.site_id) || r.site_id)))
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [user.id, user.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.site_id) return
    setSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const payload = {
        site_id: form.site_id,
        student_name: user.name,
        submitted_by: user.id,
        date: form.date,
        data_type: form.data_type,
        value: form.value ? parseFloat(form.value) : null,
        unit: form.unit || null,
        dbh: form.dbh ? parseFloat(form.dbh) : null,
        tree_height: form.tree_height ? parseFloat(form.tree_height) : null,
        irrigation_amount: form.irrigation_amount ? parseFloat(form.irrigation_amount) : null,
        phenology_stage: form.phenology_stage || null,
        notes: form.notes || null,
      }

      const { data: inserted, error: obsErr } = await supabase
        .from('field_observations')
        .insert(payload)
        .select('id,site_id,student_name,submitted_by,date,data_type,value,unit,dbh,tree_height,irrigation_amount,phenology_stage,notes,created_at')
        .single()
      if (obsErr) throw obsErr

      // Upload files to Storage and record in files table
      if (selectedFiles.length > 0) {
        const step = 90 / selectedFiles.length
        const fileRows: object[] = []
        for (let i = 0; i < selectedFiles.length; i++) {
          const f = selectedFiles[i]
          let storagePath: string | null = null
          try {
            storagePath = await uploadFile(f, inserted.id, user.name, p => setUploadProgress(i * step + p * step / 100))
          } catch {
            // If storage upload fails, still save metadata
          }
          fileRows.push({
            file_name: f.name,
            file_path: storagePath || `pending/${inserted.id}/${f.name}`,
            storage_path: storagePath,
            file_type: f.type || 'application/octet-stream',
            file_size: f.size,
            site_id: form.site_id,
            student_name: user.name,
            uploaded_by: user.id,
            observation_id: inserted.id,
            upload_date: new Date().toISOString().slice(0, 10),
            notes: form.notes || null,
          })
        }
        await supabase.from('files').insert(fileRows)
      }

      const siteName = sites.find(s => s.id === form.site_id)?.name_cn || form.site_id
      setObservations(prev => [mapObs(inserted as ObsRow, siteName, selectedFiles.length), ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
      setSelectedFiles([])
      setUploadProgress(0)
      localStorage.removeItem(DRAFT_KEY)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">野外数据采集</h1>
          <p className="text-gray-500 text-sm">共 {observations.length} 条我的记录</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 min-h-[44px] text-white rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#1a3a2a' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '录入数据'}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> 数据已提交成功
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4 text-gray-900">录入观测数据</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Site + Date + Type */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">站点 *</label>
                <select
                  value={form.site_id}
                  onChange={e => setForm({ ...form, site_id: e.target.value })}
                  className="w-full px-3 py-3 border rounded-xl text-base"
                  required
                >
                  <option value="">选择站点</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">日期 *</label>
                  <input
                    type="date" value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-3 border rounded-xl text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">数据类型 *</label>
                  <select
                    value={form.data_type}
                    onChange={e => setForm({ ...form, data_type: e.target.value as FieldDataType })}
                    className="w-full px-3 py-3 border rounded-xl text-base"
                  >
                    {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) =>
                      <option key={k} value={k}>{v.label}</option>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Type-specific fields */}
            {(form.data_type === 'soil_moisture' || form.data_type === 'sap_flow') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">数值</label>
                  <input type="number" step="0.01" value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-3 border rounded-xl text-base" placeholder="测量值" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">单位</label>
                  <input type="text" value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-3 border rounded-xl text-base" placeholder="如 %、g/h" />
                </div>
              </div>
            )}
            {form.data_type === 'growth' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">胸径 DBH (cm)</label>
                  <input type="number" step="0.1" value={form.dbh}
                    onChange={e => setForm({ ...form, dbh: e.target.value })}
                    className="w-full px-3 py-3 border rounded-xl text-base" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">树高 (m)</label>
                  <input type="number" step="0.1" value={form.tree_height}
                    onChange={e => setForm({ ...form, tree_height: e.target.value })}
                    className="w-full px-3 py-3 border rounded-xl text-base" />
                </div>
              </div>
            )}
            {form.data_type === 'irrigation' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">灌溉量 (mm)</label>
                <input type="number" step="0.1" value={form.irrigation_amount}
                  onChange={e => setForm({ ...form, irrigation_amount: e.target.value })}
                  className="w-full px-3 py-3 border rounded-xl text-base" />
              </div>
            )}
            {form.data_type === 'phenology' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">物候期</label>
                <input type="text" value={form.phenology_stage}
                  onChange={e => setForm({ ...form, phenology_stage: e.target.value })}
                  className="w-full px-3 py-3 border rounded-xl text-base" placeholder="如 展叶期、盛花期" />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">备注</label>
              <textarea value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2} className="w-full px-3 py-3 border rounded-xl text-base resize-none"
                placeholder="补充说明、观察到的异常情况等" />
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">照片 / 文件</label>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                capture="environment"
                className="hidden"
                onChange={e => setSelectedFiles(Array.from(e.target.files || []))}
              />
              <button type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-green-400 hover:text-green-700 w-full justify-center"
              >
                <Camera className="w-4 h-4" />
                {selectedFiles.length > 0
                  ? `已选择 ${selectedFiles.length} 个文件`
                  : '拍照 / 选择文件'}
              </button>
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="truncate max-w-[200px]">{f.name}</span>
                      <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload progress */}
            {submitting && selectedFiles.length > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>上传中...</span><span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={submitting}
                className="flex-1 py-3 text-white rounded-xl text-base font-medium disabled:opacity-50"
                style={{ backgroundColor: '#1a3a2a' }}>
                {submitting ? '提交中...' : '提交'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setError(null) }}
                className="px-6 py-3 border rounded-xl text-base text-gray-600">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Observation cards */}
      {observations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Droplets className="w-12 h-12 text-gray-200 mb-3" />
          <p className="text-base font-medium text-gray-400">暂无野外观测记录</p>
          <p className="text-sm text-gray-300 mt-1 mb-4">点击"录入数据"提交第一条记录</p>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm text-white rounded-xl"
            style={{ backgroundColor: '#1a3a2a' }}>
            <Plus className="w-4 h-4" /> 录入数据
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {observations.map(o => (
            <div key={o.id} className="bg-white rounded-2xl shadow-sm border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="font-medium text-gray-800 text-sm">{o.site_name}</span>
                  <span className="text-gray-400 text-xs ml-2">{o.date}</span>
                </div>
                <DataBadge dt={o.data_type} />
              </div>
              <div className="text-gray-700 text-sm mb-1">{dataValue(o)}</div>
              {o.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{o.notes}</p>}
              {(o.file_count ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                  <Upload className="w-3 h-3" /> {o.file_count} 个文件已上传
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// AdminView
// ─────────────────────────────────────────────
function AdminView() {
  const { user } = useAuth()
  const [sites, setSites] = useState<Site[]>([])
  const [observations, setObservations] = useState<Observation[]>([])
  const [files, setFiles] = useState<FileDbRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSite, setFilterSite] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterStudent, setFilterStudent] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Add-form states
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM, student_name_input: '' })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const [{ data: siteData }, { data: obsData }, { data: fileData }] = await Promise.all([
        supabase.from('sites').select('id,name_cn').order('name_cn'),
        supabase.from('field_observations')
          .select('id,site_id,student_name,submitted_by,date,data_type,value,unit,dbh,tree_height,irrigation_amount,phenology_stage,notes,created_at')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('files')
          .select('id,file_name,storage_path,file_type,file_size,observation_id,student_name,upload_date')
          .not('observation_id', 'is', null),
      ])
      if (!mounted) return
      const nextSites = (siteData || []) as Site[]
      const nameMap = new Map(nextSites.map(s => [s.id, s.name_cn]))
      const fileMap = new Map<string, number>()
      for (const f of (fileData || [])) {
        if (f.observation_id) fileMap.set(f.observation_id, (fileMap.get(f.observation_id) || 0) + 1)
      }
      setSites(nextSites)
      setFiles((fileData || []) as FileDbRow[])
      setObservations((obsData || []).map(r => mapObs(r as ObsRow, nameMap.get(r.site_id) || r.site_id, fileMap.get(r.id) || 0)))
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  // Stats
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const thisMonthObs = observations.filter(o => (o.created_at || o.date) >= monthStart)
  const studentSet = new Set(observations.map(o => o.student_name))
  const siteSet = new Set(thisMonthObs.map(o => o.site_id))

  const students = Array.from(studentSet).sort()

  const filtered = useMemo(() => observations.filter(o => {
    if (filterSite && o.site_id !== filterSite) return false
    if (filterType && o.data_type !== filterType) return false
    if (filterStudent && o.student_name !== filterStudent) return false
    if (dateFrom && o.date < dateFrom) return false
    if (dateTo && o.date > dateTo) return false
    const hay = `${o.notes || ''} ${o.student_name} ${o.site_name}`.toLowerCase()
    if (search && !hay.includes(search.toLowerCase())) return false
    return true
  }), [observations, filterSite, filterType, filterStudent, dateFrom, dateTo, search])

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.site_id) return
    setSubmitting(true)
    setError(null)
    try {
      const studentName = form.student_name_input || '管理员'
      const payload = {
        site_id: form.site_id,
        student_name: studentName,
        submitted_by: user?.id,
        date: form.date,
        data_type: form.data_type,
        value: form.value ? parseFloat(form.value) : null,
        unit: form.unit || null,
        dbh: form.dbh ? parseFloat(form.dbh) : null,
        tree_height: form.tree_height ? parseFloat(form.tree_height) : null,
        irrigation_amount: form.irrigation_amount ? parseFloat(form.irrigation_amount) : null,
        phenology_stage: form.phenology_stage || null,
        notes: form.notes || null,
      }
      const { data: inserted, error: obsErr } = await supabase
        .from('field_observations').insert(payload)
        .select('id,site_id,student_name,submitted_by,date,data_type,value,unit,dbh,tree_height,irrigation_amount,phenology_stage,notes,created_at')
        .single()
      if (obsErr) throw obsErr

      if (selectedFiles.length > 0) {
        const fileRows: object[] = []
        for (const f of selectedFiles) {
          let storagePath: string | null = null
          try { storagePath = await uploadFile(f, inserted.id, studentName, () => {}) } catch { /* ignore */ }
          fileRows.push({
            file_name: f.name,
            file_path: storagePath || `pending/${inserted.id}/${f.name}`,
            storage_path: storagePath,
            file_type: f.type || 'application/octet-stream',
            file_size: f.size,
            site_id: form.site_id,
            student_name: studentName,
            uploaded_by: user?.id,
            observation_id: inserted.id,
            upload_date: new Date().toISOString().slice(0, 10),
            notes: form.notes || null,
          })
        }
        await supabase.from('files').insert(fileRows)
      }

      const siteName = sites.find(s => s.id === form.site_id)?.name_cn || form.site_id
      setObservations(prev => [mapObs(inserted as ObsRow, siteName, selectedFiles.length), ...prev])
      setShowForm(false)
      setForm({ ...EMPTY_FORM, student_name_input: '' })
      setSelectedFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadFiles(obsId: string) {
    setDownloadingId(obsId)
    setError(null)
    try {
      const obsFiles = files.filter(f => f.observation_id === obsId && f.storage_path)
      if (obsFiles.length === 0) { setError('该记录无已上传的文件'); return }
      for (const f of obsFiles) {
        const { data, error: signErr } = await supabase.storage
          .from('field-observations')
          .createSignedUrl(f.storage_path!, 3600)
        if (signErr || !data?.signedUrl) continue
        const a = document.createElement('a')
        a.href = data.signedUrl
        a.download = f.file_name
        a.click()
      }
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-700" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">野外数据采集</h1>
          <p className="text-gray-500 text-sm mt-1">共 {observations.length} 条记录</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm"
          style={{ backgroundColor: '#1a3a2a' }}
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '录入数据'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4">录入观测数据</h3>
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">站点 *</label>
                <select value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" required>
                  <option value="">选择站点</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">日期 *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">数据类型</label>
                <select value={form.data_type} onChange={e => setForm({ ...form, data_type: e.target.value as FieldDataType })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">采集学生</label>
                <input type="text" value={form.student_name_input}
                  onChange={e => setForm({ ...form, student_name_input: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="学生姓名（可选）" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(form.data_type === 'soil_moisture' || form.data_type === 'sap_flow') && (<>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">数值</label>
                  <input type="number" step="0.01" value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="测量值" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">单位</label>
                  <input type="text" value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 %、g/h" />
                </div>
              </>)}
              {form.data_type === 'growth' && (<>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">胸径 DBH (cm)</label>
                  <input type="number" step="0.1" value={form.dbh}
                    onChange={e => setForm({ ...form, dbh: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">树高 (m)</label>
                  <input type="number" step="0.1" value={form.tree_height}
                    onChange={e => setForm({ ...form, tree_height: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </>)}
              {form.data_type === 'irrigation' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">灌溉量 (mm)</label>
                  <input type="number" step="0.1" value={form.irrigation_amount}
                    onChange={e => setForm({ ...form, irrigation_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              )}
              {form.data_type === 'phenology' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">物候期</label>
                  <input type="text" value={form.phenology_stage}
                    onChange={e => setForm({ ...form, phenology_stage: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 展叶期、盛花期" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">备注</label>
                <input type="text" value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="补充说明" />
              </div>
            </div>
            <div>
              <input ref={fileRef} type="file" multiple accept={ACCEPTED_TYPES} className="hidden"
                onChange={e => setSelectedFiles(Array.from(e.target.files || []))} />
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-green-400 hover:text-green-700">
                <Upload className="w-4 h-4" />
                {selectedFiles.length > 0 ? `已选 ${selectedFiles.length} 个文件` : '选择文件/照片（可选）'}
              </button>
            </div>
            <button type="submit" disabled={submitting}
              className="px-6 py-2 min-h-[44px] text-white rounded-lg text-sm disabled:opacity-50"
              style={{ backgroundColor: '#1a3a2a' }}>
              {submitting ? '保存中...' : '提交'}
            </button>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: BarChart3, label: '本月记录', value: thisMonthObs.length, color: 'text-green-600' },
          { icon: MapPin,    label: '本月站点', value: siteSet.size,       color: 'text-blue-600' },
          { icon: Users,     label: '采集学生', value: studentSet.size,    color: 'text-purple-600' },
          { icon: FileImage, label: '已传文件', value: files.length,       color: 'text-amber-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border p-4">
            <div className={`${color} mb-1`}><Icon className="w-5 h-5" /></div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索备注或采集人..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterSite} onChange={e => setFilterSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部站点</option>
          {sites.map(s => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部类型</option>
          {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={filterStudent} onChange={e => setFilterStudent(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部学生</option>
          {students.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm" title="开始日期" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm" title="结束日期" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">日期</th>
              <th className="px-4 py-3 text-left">站点</th>
              <th className="px-4 py-3 text-left">类型</th>
              <th className="px-4 py-3 text-left">数据</th>
              <th className="px-4 py-3 text-left">采集人</th>
              <th className="px-4 py-3 text-left">备注</th>
              <th className="px-4 py-3 text-left">文件</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">{o.date}</td>
                <td className="px-4 py-3">{o.site_name}</td>
                <td className="px-4 py-3"><DataBadge dt={o.data_type} /></td>
                <td className="px-4 py-3 whitespace-nowrap">{dataValue(o)}</td>
                <td className="px-4 py-3">{o.student_name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{o.notes}</td>
                <td className="px-4 py-3">
                  {(o.file_count ?? 0) > 0 ? (
                    <button
                      onClick={() => downloadFiles(o.id)}
                      disabled={downloadingId === o.id}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {downloadingId === o.id ? '生成中...' : `${o.file_count} 个`}
                    </button>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Droplets className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-base font-medium text-gray-400">
              {observations.length === 0 ? '暂无野外观测记录' : '没有找到匹配的数据'}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {observations.length === 0 ? '等待学生录入' : '尝试调整筛选条件'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Entry point — route by role
// ─────────────────────────────────────────────
export default function FieldData() {
  useEffect(() => { document.title = '野外数据采集 | PWRlab' }, [])
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'admin') return <AdminView />
  return <StudentView user={user} />
}
