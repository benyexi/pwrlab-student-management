import { useState } from 'react'
import { Droplets, TreePine, Ruler, CloudRain, Leaf, Search, Plus, X } from 'lucide-react'
import { SITES } from '../data/sites'
import { DEMO_FIELD_OBS } from '../data/demo'
import FileUpload from '../components/FileUpload'
import type { FieldObservation, FieldDataType } from '../types'

const DATA_TYPE_CONFIG: Record<FieldDataType, { label: string; icon: typeof Droplets; color: string }> = {
  soil_moisture: { label: '土壤含水量', icon: Droplets, color: 'bg-blue-50 text-blue-600' },
  sap_flow: { label: '树干液流', icon: TreePine, color: 'bg-green-50 text-green-600' },
  growth: { label: '树木生长量', icon: Ruler, color: 'bg-amber-50 text-amber-600' },
  irrigation: { label: '灌溉记录', icon: CloudRain, color: 'bg-cyan-50 text-cyan-600' },
  phenology: { label: '物候观测', icon: Leaf, color: 'bg-purple-50 text-purple-600' },
}

export default function FieldData() {
  const [observations, setObservations] = useState<FieldObservation[]>(DEMO_FIELD_OBS)
  const [showForm, setShowForm] = useState(false)
  const [filterSite, setFilterSite] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
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
  })

  const filtered = observations.filter((o) => {
    if (filterSite && o.site_id !== filterSite) return false
    if (filterType && o.data_type !== filterType) return false
    if (search && !o.notes?.includes(search) && !o.student_name?.includes(search)) return false
    return true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newObs: FieldObservation = {
      id: `fo_${Date.now()}`,
      site_id: form.site_id,
      student_name: '当前用户',
      date: form.date,
      data_type: form.data_type,
      value: form.value ? parseFloat(form.value) : undefined,
      unit: form.unit || undefined,
      dbh: form.dbh ? parseFloat(form.dbh) : undefined,
      tree_height: form.tree_height ? parseFloat(form.tree_height) : undefined,
      irrigation_amount: form.irrigation_amount ? parseFloat(form.irrigation_amount) : undefined,
      phenology_stage: form.phenology_stage || undefined,
      notes: form.notes,
    }
    setObservations((prev) => [newObs, ...prev])
    setShowForm(false)
  }

  const getSiteName = (siteId: string) => SITES.find((s) => s.id === siteId)?.name_cn || siteId

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

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4">录入观测数据</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">站点</label>
                <select value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                  <option value="">选择站点</option>
                  {SITES.map((s) => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">日期</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">数据类型</label>
                <select value={form.data_type} onChange={(e) => setForm({ ...form, data_type: e.target.value as FieldDataType })} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>

            {/* Dynamic fields based on type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(form.data_type === 'soil_moisture' || form.data_type === 'sap_flow') && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">数值</label>
                    <input type="number" step="0.1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="测量值" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">单位</label>
                    <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 %、g/h" />
                  </div>
                </>
              )}
              {form.data_type === 'growth' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">胸径 DBH (cm)</label>
                    <input type="number" step="0.1" value={form.dbh} onChange={(e) => setForm({ ...form, dbh: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">树高 (m)</label>
                    <input type="number" step="0.1" value={form.tree_height} onChange={(e) => setForm({ ...form, tree_height: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </>
              )}
              {form.data_type === 'irrigation' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">灌溉量 (mm)</label>
                  <input type="number" step="0.1" value={form.irrigation_amount} onChange={(e) => setForm({ ...form, irrigation_amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              )}
              {form.data_type === 'phenology' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">物候期</label>
                  <input type="text" value={form.phenology_stage} onChange={(e) => setForm({ ...form, phenology_stage: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="如 展叶期、盛花期" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">备注</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="补充说明" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">上传文件/照片</label>
              <FileUpload />
            </div>

            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">提交</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索备注或采集人..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部站点</option>
          {SITES.map((s) => <option key={s.id} value={s.id}>{s.name_cn}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="">全部类型</option>
          {Object.entries(DATA_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
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
                  <td className="px-4 py-3">{getSiteName(o.site_id)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                      <Icon className="w-3 h-3" />{config.label}
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
          <div className="text-center py-12 text-gray-400">暂无数据</div>
        )}
      </div>
    </div>
  )
}
