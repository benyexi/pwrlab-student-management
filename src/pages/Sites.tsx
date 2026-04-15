import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, TreePine, Mountain, Search, Calendar, Database, Users, FolderOpen } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type SiteRow = {
  id: string
  name_cn: string
  name_en: string
  latitude: number
  longitude: number
  elevation: number
  species_cn: string | null
  species_en: string | null
  established_year: number
  region: string | null
}

type ObsRow = {
  id: string
  site_id: string
  student_name: string | null
  date: string
  data_type: string
  value: number | null
  unit: string | null
  notes: string | null
  created_at: string | null
}

const DATA_TYPE_LABELS: Record<string, string> = {
  soil_moisture: '土壤含水量',
  sap_flow: '树干液流',
  growth: '树木生长量',
  irrigation: '灌溉记录',
  phenology: '物候观测',
  other: '其他',
}

const DATA_TYPE_OPTIONS = ['soil_moisture', 'sap_flow', 'growth', 'irrigation', 'phenology', 'other']

export default function Sites() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [sites, setSites] = useState<SiteRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [stats, setStats] = useState({ monthRecords: 0, activeSites: 0, students: 0, files: 0 })
  const [obsData, setObsData] = useState<ObsRow[]>([])
  const [obsLoading, setObsLoading] = useState(false)
  const [filterSite, setFilterSite] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [page, setPage] = useState(0)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    date: string
    site_id: string
    student_name: string
    data_type: string
    value: string
    unit: string
    notes: string
  }>({
    date: '',
    site_id: '',
    student_name: '',
    data_type: 'soil_moisture',
    value: '',
    unit: '',
    notes: '',
  })

  useEffect(() => { document.title = '监测站点 | PWRlab' }, [])

  useEffect(() => {
    let active = true

    async function fetchSites() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('sites')
        .select('*')
        .order('established_year', { ascending: false })
        .order('name_cn', { ascending: true })

      if (!active) return

      if (queryError) {
        setError(queryError.message)
        setSites([])
      } else {
        setSites((data ?? []) as SiteRow[])
      }
      setLoading(false)
    }

    fetchSites()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') return
    let active = true

    const fetchObsOverview = async () => {
      setObsLoading(true)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const monthStartText = monthStart.toISOString().slice(0, 10)
      const nextMonthStartText = nextMonthStart.toISOString().slice(0, 10)

      const [{ count: monthCount }, { data: allObs }, { count: filesCount }] = await Promise.all([
        supabase
          .from('field_observations')
          .select('id', { count: 'exact', head: true })
          .gte('date', monthStartText)
          .lt('date', nextMonthStartText),
        supabase
          .from('field_observations')
          .select('*')
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('files')
          .select('id', { count: 'exact', head: true }),
      ])

      if (!active) return

      const list = (allObs ?? []) as ObsRow[]
      const activeSiteCount = new Set(list.map((row) => row.site_id).filter(Boolean)).size
      const studentCount = new Set(list.map((row) => row.student_name ?? '').filter((name) => name !== '')).size

      setStats({
        monthRecords: monthCount ?? 0,
        activeSites: activeSiteCount,
        students: studentCount,
        files: filesCount ?? 0,
      })
      setObsData(list)
      setObsLoading(false)
    }

    fetchObsOverview()

    return () => {
      active = false
    }
  }, [user?.role])

  useEffect(() => {
    setPage(0)
  }, [filterSite, filterStudent, filterType, filterDate])

  const GAOTANG_ID = 's12'

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const base = keyword
      ? sites.filter((s) => {
          const species = `${s.species_cn ?? ''} ${s.species_en ?? ''}`.toLowerCase()
          const region = (s.region ?? '').toLowerCase()
          return (
            s.name_cn.toLowerCase().includes(keyword) ||
            s.name_en.toLowerCase().includes(keyword) ||
            species.includes(keyword) ||
            region.includes(keyword)
          )
        })
      : sites
    return [...base].sort((a, b) => {
      if (a.id === GAOTANG_ID) return -1
      if (b.id === GAOTANG_ID) return 1
      return 0
    })
  }, [search, sites])

  const siteNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    sites.forEach((site) => {
      map[site.id] = site.name_cn
    })
    return map
  }, [sites])

  const studentOptions = useMemo(() => {
    return Array.from(new Set(obsData.map((row) => row.student_name ?? '').filter((name) => name !== ''))).sort((a, b) => a.localeCompare(b))
  }, [obsData])

  const filteredObs = useMemo(() => {
    return obsData.filter((row) => {
      if (filterSite && row.site_id !== filterSite) return false
      if (filterStudent && (row.student_name ?? '') !== filterStudent) return false
      if (filterType && row.data_type !== filterType) return false
      if (filterDate && row.date !== filterDate) return false
      return true
    })
  }, [obsData, filterSite, filterStudent, filterType, filterDate])

  const pageSize = 20
  const totalPages = Math.max(1, Math.ceil(filteredObs.length / pageSize))
  const currentPage = Math.min(page, totalPages - 1)
  const pagedObs = filteredObs.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const getSpeciesLabel = (site: SiteRow) => {
    const cn = site.species_cn?.trim()
    const en = site.species_en?.trim()
    if (cn && en) return `${cn} (${en})`
    return cn || en || '未知'
  }

  const startEdit = (row: ObsRow) => {
    setEditingRow(row.id)
    setEditDraft({
      date: row.date,
      site_id: row.site_id,
      student_name: row.student_name ?? '',
      data_type: row.data_type,
      value: row.value == null ? '' : String(row.value),
      unit: row.unit ?? '',
      notes: row.notes ?? '',
    })
  }

  const saveEdit = async (rowId: string) => {
    const { error: updateError } = await supabase
      .from('field_observations')
      .update({
        date: editDraft.date,
        site_id: editDraft.site_id,
        student_name: editDraft.student_name || null,
        data_type: editDraft.data_type,
        value: editDraft.value === '' ? null : parseFloat(editDraft.value),
        unit: editDraft.unit || null,
        notes: editDraft.notes || null,
      })
      .eq('id', rowId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setObsData((prev) => prev.map((row) => (
      row.id === rowId
        ? {
            ...row,
            date: editDraft.date,
            site_id: editDraft.site_id,
            student_name: editDraft.student_name || null,
            data_type: editDraft.data_type,
            value: editDraft.value === '' ? null : parseFloat(editDraft.value),
            unit: editDraft.unit || null,
            notes: editDraft.notes || null,
          }
        : row
    )))
    setEditingRow(null)
  }

  const deleteRow = async (rowId: string) => {
    const { error: deleteError } = await supabase.from('field_observations').delete().eq('id', rowId)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setObsData((prev) => prev.filter((row) => row.id !== rowId))
  }

  const exportCSV = () => {
    const header = '日期,站点,学生,数据类型,数值,备注'
    const rows = filteredObs.map((row) => {
      return [
        row.date,
        siteNameMap[row.site_id] ?? row.site_id,
        row.student_name ?? '',
        DATA_TYPE_LABELS[row.data_type] ?? row.data_type,
        `${row.value ?? ''}${row.unit ? ` ${row.unit}` : ''}`,
        (row.notes ?? '').replace(/,/g, '，'),
      ].join(',')
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '站点原始观测数据.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        站点数据加载失败: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {user?.role === 'admin' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div><p className="text-xl font-semibold text-gray-900">{stats.monthRecords}</p><p className="text-xs text-gray-500">本月录入记录</p></div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
              <MapPin className="w-5 h-5 text-green-600" />
              <div><p className="text-xl font-semibold text-gray-900">{stats.activeSites}</p><p className="text-xs text-gray-500">活跃站点数</p></div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
              <Users className="w-5 h-5 text-amber-600" />
              <div><p className="text-xl font-semibold text-gray-900">{stats.students}</p><p className="text-xs text-gray-500">参与学生数</p></div>
            </div>
            <div className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-purple-600" />
              <div><p className="text-xl font-semibold text-gray-900">{stats.files}</p><p className="text-xs text-gray-500">上传文件数</p></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">原始观测数据总览</h2>
              <button
                onClick={exportCSV}
                className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-sm hover:bg-gray-100"
              >
                导出CSV
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">全部站点</option>
                {sites.map((site) => <option key={site.id} value={site.id}>{site.name_cn}</option>)}
              </select>
              <select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">全部学生</option>
                {studentOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">全部类型</option>
                {DATA_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{DATA_TYPE_LABELS[type]}</option>)}
              </select>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              <button
                onClick={() => {
                  setFilterSite('')
                  setFilterStudent('')
                  setFilterType('')
                  setFilterDate('')
                }}
                className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700 text-sm hover:bg-gray-100"
              >
                重置
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-3 py-2 text-left">日期</th>
                    <th className="px-3 py-2 text-left">站点</th>
                    <th className="px-3 py-2 text-left">学生</th>
                    <th className="px-3 py-2 text-left">数据类型</th>
                    <th className="px-3 py-2 text-left">数值</th>
                    <th className="px-3 py-2 text-left">备注</th>
                    <th className="px-3 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {obsLoading ? (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">加载中…</td></tr>
                  ) : pagedObs.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400">暂无数据</td></tr>
                  ) : pagedObs.map((row) => {
                    const isEditing = editingRow === row.id
                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <input type="date" value={editDraft.date} onChange={(e) => setEditDraft((prev) => ({ ...prev, date: e.target.value }))} className="px-2 py-1 border rounded" />
                          ) : row.date}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <select value={editDraft.site_id} onChange={(e) => setEditDraft((prev) => ({ ...prev, site_id: e.target.value }))} className="px-2 py-1 border rounded">
                              {sites.map((site) => <option key={site.id} value={site.id}>{site.name_cn}</option>)}
                            </select>
                          ) : (siteNameMap[row.site_id] ?? row.site_id)}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <input type="text" value={editDraft.student_name} onChange={(e) => setEditDraft((prev) => ({ ...prev, student_name: e.target.value }))} className="px-2 py-1 border rounded" />
                          ) : (row.student_name || '—')}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <select value={editDraft.data_type} onChange={(e) => setEditDraft((prev) => ({ ...prev, data_type: e.target.value }))} className="px-2 py-1 border rounded">
                              {DATA_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{DATA_TYPE_LABELS[type]}</option>)}
                            </select>
                          ) : (DATA_TYPE_LABELS[row.data_type] ?? row.data_type)}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input type="number" step="0.01" value={editDraft.value} onChange={(e) => setEditDraft((prev) => ({ ...prev, value: e.target.value }))} className="px-2 py-1 border rounded w-24" />
                              <input type="text" value={editDraft.unit} onChange={(e) => setEditDraft((prev) => ({ ...prev, unit: e.target.value }))} className="px-2 py-1 border rounded w-20" placeholder="单位" />
                            </div>
                          ) : `${row.value ?? ''}${row.unit ? ` ${row.unit}` : ''}`}
                        </td>
                        <td className="px-3 py-2">
                          {isEditing ? (
                            <input type="text" value={editDraft.notes} onChange={(e) => setEditDraft((prev) => ({ ...prev, notes: e.target.value }))} className="px-2 py-1 border rounded w-full" />
                          ) : (row.notes || '—')}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <button onClick={() => saveEdit(row.id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700">保存</button>
                                <button onClick={() => setEditingRow(null)} className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs hover:bg-gray-200">取消</button>
                              </>
                            ) : (
                              <button onClick={() => startEdit(row)} className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs hover:bg-blue-100">编辑</button>
                            )}
                            <button onClick={() => deleteRow(row.id)} className="px-2 py-1 rounded bg-red-50 text-red-700 text-xs hover:bg-red-100">删除</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
              >
                上一页
              </button>
              <span className="text-gray-600">第 {currentPage + 1} 页 / 共 {totalPages} 页</span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 rounded border disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">站点管理</h1>
          <p className="text-gray-500 text-sm mt-1">CP-GPE 观测网络 · 共 {sites.length} 个站点</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索站点名、树种..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((site) => {
          const isGaotang = site.id === GAOTANG_ID
          return (
          <div
            key={site.id}
            onClick={() => navigate(isGaotang ? '/sites/gaotang' : `/sites/${site.id}`)}
            className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer hover:shadow-md transition-all group ${
              isGaotang
                ? 'border-green-400 ring-2 ring-green-200 hover:border-green-500'
                : 'border-gray-100 hover:border-green-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                    {site.name_cn}
                  </h3>
                  {isGaotang && (
                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full font-medium">主站点</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{site.name_en}</p>
              </div>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                {site.id.toUpperCase()}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{site.latitude.toFixed(2)}°N, {Math.abs(site.longitude).toFixed(2)}°{site.longitude >= 0 ? 'E' : 'W'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mountain className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>海拔 {site.elevation}m</span>
              </div>
              <div className="flex items-center gap-2">
                <TreePine className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{getSpeciesLabel(site)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>建站 {site.established_year}</span>
              </div>
            </div>
          </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>没有找到匹配的站点</p>
        </div>
      )}
    </div>
  )
}
