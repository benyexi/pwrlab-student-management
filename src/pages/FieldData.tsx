import { useEffect, useMemo, useState } from 'react'
import { Droplets, TreePine, Ruler, CloudRain, Leaf, Search, Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import FileUpload from '../components/FileUpload'
import type { FieldDataType } from '../types'

type SiteRow = {
  id: string
  name_cn: string
  name_en: string | null
  latitude: number | null
  longitude: number | null
  elevation: number | null
  species_cn: string | null
  species_en: string | null
  established_year: number | null
}

type FieldObservationRow = {
  id: string
  site_id: string
  student_name: string | null
  date: string
  data_type: FieldDataType
  value: number | null
  unit: string | null
  dbh: number | null
  tree_height: number | null
  irrigation_amount: number | null
  phenology_stage: string | null
  notes: string | null
  created_at: string | null
}

type FileRow = {
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  site_id: string
  student_name: string
  upload_date: string
  notes: string | null
}

type Site = {
  id: string
  name_cn: string
  name_en: string
  latitude: number
  longitude: number
  elevation: number
  tree_species: string
  established_year: number
}

type FieldObservation = {
  id: string
  site_id: string
  site_name: string
  student_name: string
  date: string
  data_type: FieldDataType
  value?: number
  unit?: string
  dbh?: number
  tree_height?: number
  irrigation_amount?: number
  phenology_stage?: string
  notes?: string
  created_at?: string
}

const DATA_TYPE_CONFIG: Record<FieldDataType, { label: string; icon: typeof Droplets; color: string }> = {
  soil_moisture: { label: '土壤含水量', icon: Droplets, color: 'bg-blue-50 text-blue-600' },
  sap_flow: { label: '树干液流', icon: TreePine, color: 'bg-green-50 text-green-600' },
  growth: { label: '树木生长量', icon: Ruler, color: 'bg-amber-50 text-amber-600' },
  irrigation: { label: '灌溉记录', icon: CloudRain, color: 'bg-cyan-50 text-cyan-600' },
  phenology: { label: '物候观测', icon: Leaf, color: 'bg-purple-50 text-purple-600' },
  other: { label: '其他', icon: Leaf, color: 'bg-slate-50 text-slate-600' },
}

const emptyForm = {
  site_id: '',
  date: new Date().toISOString().slice(0, 10),
  data_type: 'soil_moisture' as FieldDataType,
  value: '',
  unit: '',
  dbh: '',
  tree_height: '',
  irrigation_amount: '',
  phenology_stage: '',
  notes: '',
}

function mapSite(row: SiteRow): Site {
  return {
    id: row.id,
    name_cn: row.name_cn,
    name_en: row.name_en || '',
    latitude: row.latitude || 0,
    longitude: row.longitude || 0,
    elevation: row.elevation || 0,
    tree_species: row.species_cn || row.species_en || '',
    established_year: row.established_year || new Date().getFullYear(),
  }
}

function mapObservation(row: FieldObservationRow, siteName: string): FieldObservation {
  return {
    id: row.id,
    site_id: row.site_id,
    site_name: siteName,
    student_name: row.student_name || '未命名',
    date: row.date,
    data_type: row.data_type,
    value: row.value ?? undefined,
    unit: row.unit || undefined,
    dbh: row.dbh ?? undefined,
    tree_height: row.tree_height ?? undefined,
    irrigation_amount: row.irrigation_amount ?? undefined,
    phenology_stage: row.phenology_stage || undefined,
    notes: row.notes || undefined,
    created_at: row.created_at || undefined,
  }
}

export default function FieldData() {
  useEffect(() => { document.title = '野外数据采集 | PWRlab' }, [])

  const [sites, setSites] = useState<Site[]>([])
  const [observations, setObservations] = useState<FieldObservation[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterSite, setFilterSite] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('当前用户')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    const [{ data: siteData, error: siteError }, { data: obsData, error: obsError }, { data: userData }] = await Promise.all([
      supabase.from('sites').select('id,name_cn,name_en,latitude,longitude,elevation,species_cn,species_en,established_year').order('name_cn', { ascending: true }),
      supabase.from('field_observations').select('id,site_id,student_name,date,data_type,value,unit,dbh,tree_height,irrigation_amount,phenology_stage,notes,created_at').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])

    if (siteError || obsError) {
      setError(siteError?.message || obsError?.message || '加载野外数据失败')
      setSites([])
      setObservations([])
      setLoading(false)
      return
    }

    const nextSites = (siteData || []).map(mapSite)
    const siteNameMap = new Map(nextSites.map((site) => [site.id, site.name_cn]))
    const nextObservations = (obsData || []).map((row) => mapObservation(row, siteNameMap.get(row.site_id) || row.site_id))

    setSites(nextSites)
    setObservations(nextObservations)
    setStudentName(userData.user?.email?.split('@')[0] || '当前用户')
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return observations.filter((o) => {
      if (filterSite && o.site_id !== filterSite) return false
      if (filterType && o.data_type !== filterType) return false
      const haystack = `${o.notes || ''} ${o.student_name} ${o.site_name}`.toLowerCase()
      if (search && !haystack.includes(search.toLowerCase())) return false
      return true
    })
  }, [filterSite, filterType, observations, search])

  const getSiteName = (siteId: string) => sites.find((s) => s.id === siteId)?.name_cn || siteId

  const resetForm = () => {
    setForm(emptyForm)
    setSelectedFiles([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.site_id) return

    setSubmitting(true)
    setError(null)

    try {
      const observationPayload = {
        site_id: form.site_id,
        student_name: studentName,
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

      const { data: insertedObservation, error: observationError } = await supabase
        .from('field_observations')
        .insert(observationPayload)
        .select('id,site_id,student_name,date,data_type,value,unit,dbh,tree_height,irrigation_amount,phenology_stage,notes,created_at')
        .single()

      if (observationError) throw observationError

      const siteName = getSiteName(form.site_id)
      const nextObservation = mapObservation(insertedObservation as FieldObservationRow, siteName)
      setObservations((prev) => [nextObservation, ...prev])

      if (selectedFiles.length > 0) {
        const fileRows: FileRow[] = selectedFiles.map((file, index) => ({
          file_name: file.name,
          file_path: `metadata-only/field-observations/${insertedObservation.id}/${index}-${file.name}`,
          file_type: file.type || 'application/octet-stream',
          file_size: file.size,
          site_id: form.site_id,
          student_name: studentName,
          upload_date: new Date().toISOString().slice(0, 10),
          notes: form.notes || null,
        }))

        const { error: fileError } = await supabase.from('files').insert(fileRows)
        if (fileError) throw fileError
      }

      setShowForm(false)
      resetForm()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '保存失败，请重试'
      setError(message)
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">野外数据采集</h1>
          <p className="text-gray-500 text-sm mt-1">共 {observations.length} 条记录</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '录入数据'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4">录入观测数据</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">站点</label>
                <select
                  value={form.site_id}
                  onChange={(e) => setForm({ ...form, site_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                >
                  <option value="">选择站点</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name_cn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">日期</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">数据类型</label>
                <select
                  value={form.data_type}
                  onChange={(e) => setForm({ ...form, data_type: e.target.value as FieldDataType })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(form.data_type === 'soil_moisture' || form.data_type === 'sap_flow') && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">数值</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.value}
                      onChange={(e) => setForm({ ...form, value: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="测量值"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">单位</label>
                    <input
                      type="text"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      placeholder="如 %、g/h"
                    />
                  </div>
                </>
              )}
              {form.data_type === 'growth' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">胸径 DBH (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.dbh}
                      onChange={(e) => setForm({ ...form, dbh: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">树高 (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.tree_height}
                      onChange={(e) => setForm({ ...form, tree_height: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
              {form.data_type === 'irrigation' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">灌溉量 (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.irrigation_amount}
                    onChange={(e) => setForm({ ...form, irrigation_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              {form.data_type === 'phenology' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">物候期</label>
                  <input
                    type="text"
                    value={form.phenology_stage}
                    onChange={(e) => setForm({ ...form, phenology_stage: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="如 展叶期、盛花期"
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">备注</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="补充说明"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">上传文件/照片</label>
              <FileUpload files={selectedFiles} onFilesChange={setSelectedFiles} />
              <p className="text-xs text-gray-400 mt-2">
                文件二进制未上传到 Storage，仅保存到 `files` 表的元数据，`file_path` 使用稳定占位路径。
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 min-h-[44px] bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
            >
              {submitting ? '保存中...' : '提交'}
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索备注或采集人..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部站点</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name_cn}
            </option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部类型</option>
          {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">日期</th>
              <th className="px-4 py-3 text-left">站点</th>
              <th className="px-4 py-3 text-left">类型</th>
              <th className="px-4 py-3 text-left">数据</th>
              <th className="px-4 py-3 text-left">采集人</th>
              <th className="px-4 py-3 text-left">备注</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((o) => {
              const config = DATA_TYPE_CONFIG[o.data_type]
              const Icon = config.icon
              return (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{o.date}</td>
                  <td className="px-4 py-3">{o.site_name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.value !== undefined && <span>{o.value} {o.unit}</span>}
                    {o.dbh !== undefined && <span>DBH: {o.dbh}cm, H: {o.tree_height}m</span>}
                    {o.irrigation_amount !== undefined && <span>{o.irrigation_amount} mm</span>}
                    {o.phenology_stage && <span>{o.phenology_stage}</span>}
                  </td>
                  <td className="px-4 py-3">{o.student_name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{o.notes}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Droplets className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-base font-medium text-gray-400">
              {observations.length === 0 ? '暂无野外观测记录' : '没有找到匹配的数据'}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {observations.length === 0 ? '点击"录入数据"添加第一条记录' : '尝试调整筛选条件'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
