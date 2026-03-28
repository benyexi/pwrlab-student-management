import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, TreePine, Mountain, Search, Calendar } from 'lucide-react'
import { SITES } from '../data/sites'

export default function Sites() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = SITES.filter(
    (s) =>
      s.name_cn.includes(search) ||
      s.name_en.toLowerCase().includes(search.toLowerCase()) ||
      s.tree_species.includes(search)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">站点管理</h1>
          <p className="text-gray-500 text-sm mt-1">CP-GPE 观测网络 · 共 {SITES.length} 个站点</p>
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
        {filtered.map((site) => (
          <div
            key={site.id}
            onClick={() => navigate(`/sites/${site.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-green-200 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                  {site.name_cn}
                </h3>
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
                <span className="truncate">{site.tree_species}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span>建站 {site.established_year}</span>
              </div>
            </div>
          </div>
        ))}
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
