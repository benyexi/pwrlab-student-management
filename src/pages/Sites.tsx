import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, TreePine, Mountain, Search, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

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

export default function Sites() {
  const navigate = useNavigate()
  const [sites, setSites] = useState<SiteRow[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    // Gaotang always first
    return [...base].sort((a, b) => {
      if (a.id === GAOTANG_ID) return -1
      if (b.id === GAOTANG_ID) return 1
      return 0
    })
  }, [search, sites])

  const getSpeciesLabel = (site: SiteRow) => {
    const cn = site.species_cn?.trim()
    const en = site.species_en?.trim()
    if (cn && en) return `${cn} (${en})`
    return cn || en || '未知'
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
