import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Mountain, TreePine, Calendar, Cloud, Plus, RefreshCw } from 'lucide-react'
import { SITES } from '../data/sites'
import { DEMO_WEATHER } from '../data/demo'
import { fetchCurrentWeather } from '../lib/weather'
import type { WeatherRecord, WeatherSource } from '../types'

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const site = SITES.find((s) => s.id === id)

  const [weather, setWeather] = useState<WeatherRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    temperature: '',
    rainfall: '',
    humidity: '',
    wind_speed: '',
    weather_desc: '',
  })

  useEffect(() => {
    // Load demo weather data for this site
    const siteWeather = DEMO_WEATHER.map((w) => ({ ...w, site_id: id || 's07' }))
    setWeather(siteWeather)
  }, [id])

  const handleFetchWeather = async () => {
    if (!site) return
    setLoading(true)
    try {
      const data = await fetchCurrentWeather(site.latitude, site.longitude)
      const newRecord: WeatherRecord = {
        id: `w_auto_${Date.now()}`,
        site_id: site.id,
        date: new Date().toISOString().slice(0, 10),
        temperature: data.temperature,
        temperature_min: data.temperature_min,
        temperature_max: data.temperature_max,
        rainfall: data.rainfall,
        humidity: data.humidity,
        wind_speed: data.wind_speed,
        weather_desc: data.weather_desc,
        source: 'auto' as WeatherSource,
      }
      setWeather((prev) => [newRecord, ...prev])
    } catch {
      alert('获取天气数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newRecord: WeatherRecord = {
      id: `w_manual_${Date.now()}`,
      site_id: id || '',
      date: form.date,
      temperature: parseFloat(form.temperature),
      rainfall: parseFloat(form.rainfall),
      humidity: parseFloat(form.humidity),
      wind_speed: parseFloat(form.wind_speed),
      weather_desc: form.weather_desc,
      source: 'manual' as WeatherSource,
    }
    setWeather((prev) => [newRecord, ...prev])
    setShowForm(false)
    setForm({ date: new Date().toISOString().slice(0, 10), temperature: '', rainfall: '', humidity: '', wind_speed: '', weather_desc: '' })
  }

  // Simple chart rendering using SVG
  const chartData = useMemo(() => {
    const sorted = [...weather].sort((a, b) => a.date.localeCompare(b.date)).slice(-10)
    return sorted
  }, [weather])

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">站点未找到</p>
        <button onClick={() => navigate('/sites')} className="mt-4 text-green-600 hover:underline">返回站点列表</button>
      </div>
    )
  }

  const maxTemp = Math.max(...chartData.map((d) => d.temperature), 1)
  const maxRain = Math.max(...chartData.map((d) => d.rainfall), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sites')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.name_cn}</h1>
          <p className="text-gray-500 text-sm">{site.name_en}</p>
        </div>
      </div>

      {/* Site Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><MapPin className="w-3.5 h-3.5" />坐标</div>
          <p className="font-semibold text-sm">{site.latitude}°N, {Math.abs(site.longitude).toFixed(2)}°{site.longitude >= 0 ? 'E' : 'W'}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Mountain className="w-3.5 h-3.5" />海拔</div>
          <p className="font-semibold text-sm">{site.elevation} m</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><TreePine className="w-3.5 h-3.5" />树种</div>
          <p className="font-semibold text-sm truncate">{site.tree_species}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Calendar className="w-3.5 h-3.5" />建站年份</div>
          <p className="font-semibold text-sm">{site.established_year}</p>
        </div>
      </div>

      {/* Weather Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">近10天天气趋势</h2>
        {chartData.length > 0 ? (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 600 200" className="w-full min-w-[500px]" style={{ maxHeight: 220 }}>
              {/* Temperature line */}
              <polyline
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                points={chartData.map((d, i) => `${40 + i * (520 / Math.max(chartData.length - 1, 1))},${170 - (d.temperature / maxTemp) * 140}`).join(' ')}
              />
              {chartData.map((d, i) => (
                <g key={`t${i}`}>
                  <circle
                    cx={40 + i * (520 / Math.max(chartData.length - 1, 1))}
                    cy={170 - (d.temperature / maxTemp) * 140}
                    r="3" fill="#ef4444"
                  />
                  <text
                    x={40 + i * (520 / Math.max(chartData.length - 1, 1))}
                    y={170 - (d.temperature / maxTemp) * 140 - 8}
                    textAnchor="middle" fontSize="9" fill="#ef4444"
                  >{d.temperature}°</text>
                </g>
              ))}
              {/* Rainfall bars */}
              {chartData.map((d, i) => (
                <g key={`r${i}`}>
                  <rect
                    x={40 + i * (520 / Math.max(chartData.length - 1, 1)) - 8}
                    y={170 - (d.rainfall / maxRain) * 60}
                    width="16"
                    height={(d.rainfall / maxRain) * 60}
                    fill="#3b82f6" opacity="0.4" rx="2"
                  />
                  {d.rainfall > 0 && (
                    <text
                      x={40 + i * (520 / Math.max(chartData.length - 1, 1))}
                      y={170 - (d.rainfall / maxRain) * 60 - 4}
                      textAnchor="middle" fontSize="8" fill="#3b82f6"
                    >{d.rainfall}mm</text>
                  )}
                </g>
              ))}
              {/* X axis labels */}
              {chartData.map((d, i) => (
                <text
                  key={`x${i}`}
                  x={40 + i * (520 / Math.max(chartData.length - 1, 1))}
                  y="192" textAnchor="middle" fontSize="8" fill="#9ca3af"
                >{d.date.slice(5)}</text>
              ))}
              {/* Legend */}
              <circle cx="450" cy="10" r="4" fill="#ef4444" />
              <text x="458" y="14" fontSize="9" fill="#666">温度(°C)</text>
              <rect x="510" y="6" width="10" height="8" fill="#3b82f6" opacity="0.4" rx="1" />
              <text x="524" y="14" fontSize="9" fill="#666">降雨(mm)</text>
            </svg>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">暂无天气数据</p>
        )}
      </div>

      {/* Weather Records Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">天气记录</h2>
          <div className="flex gap-2">
            <button
              onClick={handleFetchWeather}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              自动获取
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm hover:bg-green-100"
            >
              <Plus className="w-3.5 h-3.5" />
              手动录入
            </button>
          </div>
        </div>

        {/* Manual Form */}
        {showForm && (
          <form onSubmit={handleManualSubmit} className="p-5 bg-gray-50 border-b grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="0.1" placeholder="温度(°C)" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="0.1" placeholder="降雨(mm)" value={form.rainfall} onChange={(e) => setForm({ ...form, rainfall: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="1" placeholder="湿度(%)" value={form.humidity} onChange={(e) => setForm({ ...form, humidity: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="0.1" placeholder="风速(m/s)" value={form.wind_speed} onChange={(e) => setForm({ ...form, wind_speed: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <div className="flex gap-2">
              <input type="text" placeholder="天气状况" value={form.weather_desc} onChange={(e) => setForm({ ...form, weather_desc: e.target.value })} className="px-3 py-2 border rounded-lg text-sm flex-1" required />
              <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 whitespace-nowrap">保存</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">日期</th>
                <th className="px-4 py-3 text-right">温度(°C)</th>
                <th className="px-4 py-3 text-right">降雨(mm)</th>
                <th className="px-4 py-3 text-right">湿度(%)</th>
                <th className="px-4 py-3 text-right">风速(m/s)</th>
                <th className="px-4 py-3 text-left">天气</th>
                <th className="px-4 py-3 text-center">来源</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {weather.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{w.date}</td>
                  <td className="px-4 py-3 text-right">{w.temperature}</td>
                  <td className="px-4 py-3 text-right">{w.rainfall}</td>
                  <td className="px-4 py-3 text-right">{w.humidity}</td>
                  <td className="px-4 py-3 text-right">{w.wind_speed}</td>
                  <td className="px-4 py-3"><Cloud className="w-3.5 h-3.5 inline mr-1 text-gray-400" />{w.weather_desc}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      w.source === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {w.source === 'auto' ? '自动' : '手动'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
