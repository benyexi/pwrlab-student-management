import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Mountain, TreePine, Calendar, Cloud, Plus, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchCurrentWeather } from '../lib/weather'
import type { WeatherRecord, WeatherSource } from '../types'

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
  created_at?: string
}

type WeatherRow = WeatherRecord & {
  recorded_by?: string | null
}

const EMPTY_FORM = {
  date: new Date().toISOString().slice(0, 10),
  temperature: '',
  rainfall: '',
  humidity: '',
  wind_speed: '',
  weather_desc: '',
}

const normalizeWeatherRecord = (record: WeatherRow): WeatherRecord => ({
  id: record.id,
  site_id: record.site_id,
  date: record.date,
  temperature: record.temperature,
  temperature_min: record.temperature_min ?? undefined,
  temperature_max: record.temperature_max ?? undefined,
  rainfall: record.rainfall,
  humidity: record.humidity,
  wind_speed: record.wind_speed,
  weather_desc: record.weather_desc,
  source: record.source,
  created_at: record.created_at,
})

const getSpeciesLabel = (site: SiteRow) => {
  const cn = site.species_cn?.trim()
  const en = site.species_en?.trim()
  if (cn && en) return `${cn} (${en})`
  return cn || en || '未知'
}

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [site, setSite] = useState<SiteRow | null>(null)
  const [weather, setWeather] = useState<WeatherRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    let active = true

    async function fetchData() {
      if (!id) {
        setSite(null)
        setWeather([])
        setError('站点参数缺失')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const [{ data: siteData, error: siteError }, { data: weatherData, error: weatherError }] = await Promise.all([
        supabase.from('sites').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('weather_records')
          .select('*')
          .eq('site_id', id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
      ])

      if (!active) return

      if (siteError) {
        setError(siteError.message)
        setSite(null)
        setWeather([])
      } else if (!siteData) {
        setError('站点未找到')
        setSite(null)
        setWeather([])
      } else {
        setSite(siteData as SiteRow)
        if (weatherError) {
          setError(weatherError.message)
          setWeather([])
        } else {
          setWeather((weatherData ?? []).map((row) => normalizeWeatherRecord(row as WeatherRow)))
        }
      }

      setLoading(false)
    }

    fetchData()

    return () => {
      active = false
    }
  }, [id])

  const chartData = useMemo(() => {
    const sorted = [...weather].sort((a, b) => a.date.localeCompare(b.date)).slice(-10)
    return sorted
  }, [weather])

  const handleFetchWeather = async () => {
    if (!site) return

    setSaving(true)
    setError(null)
    try {
      const data = await fetchCurrentWeather(site.latitude, site.longitude)
      const { data: authData } = await supabase.auth.getUser()
      const payload = {
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
        recorded_by: authData.user?.id ?? null,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('weather_records')
        .insert(payload)
        .select('*')
        .single()

      if (insertError) throw insertError
      if (inserted) {
        setWeather((prev) => [normalizeWeatherRecord(inserted as WeatherRow), ...prev])
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : '获取天气数据失败'
      setError(message)
      alert('获取天气数据失败')
    } finally {
      setSaving(false)
    }
  }

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!site) return

    setSaving(true)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const payload = {
        site_id: site.id,
        date: form.date,
        temperature: parseFloat(form.temperature),
        rainfall: parseFloat(form.rainfall),
        humidity: parseFloat(form.humidity),
        wind_speed: parseFloat(form.wind_speed),
        weather_desc: form.weather_desc,
        source: 'manual' as WeatherSource,
        recorded_by: authData.user?.id ?? null,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('weather_records')
        .insert(payload)
        .select('*')
        .single()

      if (insertError) throw insertError

      if (inserted) {
        setWeather((prev) => [normalizeWeatherRecord(inserted as WeatherRow), ...prev])
      }

      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '保存失败'
      setError(message)
      alert('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />
      </div>
    )
  }

  if (!site) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/sites')} className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          返回站点列表
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || '站点未找到'}
        </div>
      </div>
    )
  }

  const maxTemp = Math.max(...chartData.map((d) => d.temperature), 1)
  const maxRain = Math.max(...chartData.map((d) => d.rainfall), 1)

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sites')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.name_cn}</h1>
          <p className="text-gray-500 text-sm">{site.name_en}</p>
        </div>
      </div>

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
          <p className="font-semibold text-sm truncate">{getSpeciesLabel(site)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 text-xs mb-1"><Calendar className="w-3.5 h-3.5" />建站年份</div>
          <p className="font-semibold text-sm">{site.established_year}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold text-gray-900 mb-4">近10天天气趋势</h2>
        {chartData.length > 0 ? (
          <div className="overflow-x-auto">
            <svg viewBox="0 0 600 200" className="w-full min-w-[500px]" style={{ maxHeight: 220 }}>
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
              {chartData.map((d, i) => (
                <text
                  key={`x${i}`}
                  x={40 + i * (520 / Math.max(chartData.length - 1, 1))}
                  y="192" textAnchor="middle" fontSize="8" fill="#9ca3af"
                >{d.date.slice(5)}</text>
              ))}
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

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">天气记录</h2>
          <div className="flex gap-2">
            <button
              onClick={handleFetchWeather}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
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

        {showForm && (
          <form onSubmit={handleManualSubmit} className="p-5 bg-gray-50 border-b grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="0.1" placeholder="温度(°C)" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="0.1" placeholder="降雨(mm)" value={form.rainfall} onChange={(e) => setForm({ ...form, rainfall: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="1" placeholder="湿度(%)" value={form.humidity} onChange={(e) => setForm({ ...form, humidity: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <input type="number" step="0.1" placeholder="风速(m/s)" value={form.wind_speed} onChange={(e) => setForm({ ...form, wind_speed: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" required />
            <div className="flex gap-2">
              <input type="text" placeholder="天气状况" value={form.weather_desc} onChange={(e) => setForm({ ...form, weather_desc: e.target.value })} className="px-3 py-2 border rounded-lg text-sm flex-1" required />
              <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">保存</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-3 py-3 text-left whitespace-nowrap">日期</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">温度(°C)</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">降雨(mm)</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">湿度(%)</th>
                <th className="px-3 py-3 text-right whitespace-nowrap">风速(m/s)</th>
                <th className="px-3 py-3 text-left whitespace-nowrap">天气</th>
                <th className="px-3 py-3 text-center whitespace-nowrap">来源</th>
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
