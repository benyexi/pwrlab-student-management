import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Mountain, TreePine, Calendar, Cloud, Plus, RefreshCw, Download } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fetchCurrentWeather } from '../lib/weather'
import { useAuth } from '../contexts/AuthContext'
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

// ─── 30-day pruning helper ────────────────────────────────────────────────────
async function pruneOldRecords(siteId: string) {
  const { data: allRecords, error } = await supabase
    .from('weather_records')
    .select('id, date')
    .eq('site_id', siteId)
    .order('date', { ascending: true })
  if (error || !allRecords) return
  if (allRecords.length > 30) {
    const toDelete = allRecords.slice(0, allRecords.length - 30)
    const ids = toDelete.map((r: { id: string }) => r.id)
    await supabase.from('weather_records').delete().in('id', ids)
  }
}

// ─── Mini SVG chart helpers ───────────────────────────────────────────────────
const W = 400
const H = 100
const PAD = { left: 4, right: 4, top: 12, bottom: 28 }
const innerW = W - PAD.left - PAD.right
const innerH = H - PAD.top - PAD.bottom

function xPos(i: number, total: number) {
  if (total <= 1) return PAD.left + innerW / 2
  return PAD.left + (i / (total - 1)) * innerW
}

function yPos(val: number, minVal: number, maxVal: number) {
  const range = maxVal - minVal || 1
  return PAD.top + innerH - ((val - minVal) / range) * innerH
}

type MiniChartProps = {
  data: WeatherRecord[]
  field: 'temperature' | 'rainfall' | 'humidity' | 'wind_speed'
  color: string
  gradientId: string
  type: 'line' | 'bar'
  label: string
  overlayData?: WeatherRecord[]   // manual records shown as orange dots
}

function MiniChart({ data, field, color, gradientId, type, label, overlayData }: MiniChartProps) {
  const values = data.map((d) => (d[field] as number | null | undefined) ?? 0)
  const minVal = type === 'line' ? Math.min(...values) : 0
  const maxVal = Math.max(...values, type === 'bar' ? 1 : minVal + 1)
  const latest = data.length > 0 ? values[values.length - 1] : null

  const unitMap: Record<string, string> = {
    temperature: '°C',
    rainfall: 'mm',
    humidity: '%',
    wind_speed: 'm/s',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        {latest !== null ? (
          <span className="text-sm font-bold" style={{ color }}>
            {latest}{unitMap[field]}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center text-gray-300 text-xs" style={{ height: H }}>
          暂无数据
        </div>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {type === 'line' && (() => {
            const pts = data.map((d, i) => {
              const v = (d[field] as number | null | undefined) ?? 0
              return `${xPos(i, data.length)},${yPos(v, minVal, maxVal)}`
            })
            const areaPath =
              `M ${pts[0]} ` +
              pts.slice(1).map((p) => `L ${p}`).join(' ') +
              ` L ${xPos(data.length - 1, data.length)},${PAD.top + innerH}` +
              ` L ${xPos(0, data.length)},${PAD.top + innerH} Z`
            return (
              <>
                <path d={areaPath} fill={`url(#${gradientId})`} />
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                  points={pts.join(' ')}
                />
                {data.map((d, i) => {
                  const v = (d[field] as number | null | undefined) ?? 0
                  return (
                    <circle
                      key={i}
                      cx={xPos(i, data.length)}
                      cy={yPos(v, minVal, maxVal)}
                      r="2"
                      fill={color}
                    />
                  )
                })}
              </>
            )
          })()}

          {type === 'bar' && (() => {
            const barW = Math.max(2, (innerW / data.length) * 0.6)
            return (
              <>
                {data.map((d, i) => {
                  const v = (d[field] as number | null | undefined) ?? 0
                  const bh = ((v - 0) / (maxVal - 0)) * innerH
                  const bx = xPos(i, data.length) - barW / 2
                  const by = PAD.top + innerH - bh
                  return (
                    <g key={i}>
                      <defs>
                        <linearGradient id={`${gradientId}_bar_${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
                          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                        </linearGradient>
                      </defs>
                      <rect
                        x={bx}
                        y={by}
                        width={barW}
                        height={Math.max(bh, 0)}
                        fill={`url(#${gradientId}_bar_${i})`}
                        rx="1"
                      />
                    </g>
                  )
                })}
              </>
            )
          })()}

          {/* Orange overlay dots for manual records */}
          {overlayData && overlayData.map((d, i) => {
            const v = (d[field] as number | null | undefined) ?? 0
            // find x position by matching date in main data array
            const mainIdx = data.findIndex(m => m.date === d.date)
            const cx = mainIdx >= 0
              ? xPos(mainIdx, data.length)
              : xPos(i, Math.max(data.length, 1))
            const cy = yPos(v, type === 'line' ? Math.min(...data.map(dd => (dd[field] as number) ?? 0), v) : 0,
              Math.max(...data.map(dd => (dd[field] as number) ?? 0), v, type === 'bar' ? 1 : 0))
            return (
              <circle key={`ov${i}`} cx={cx} cy={cy} r="4"
                fill="#f97316" stroke="white" strokeWidth="1.5" opacity="0.9" />
            )
          })}

          {/* X-axis date labels — one every 5 items */}
          {data.map((d, i) => {
            if (i % 5 !== 0 && i !== data.length - 1) return null
            return (
              <text
                key={`xl${i}`}
                x={xPos(i, data.length)}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
              >
                {d.date.slice(5)}
              </text>
            )
          })}
        </svg>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SiteDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [site, setSite] = useState<SiteRow | null>(null)
  const [weather, setWeather] = useState<WeatherRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    document.title = site ? `${site.name_cn} | PWRlab` : '站点详情 | PWRlab'
  }, [site])

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
          const records = (weatherData ?? []).map((row) => normalizeWeatherRecord(row as WeatherRow))
          setWeather(records)

          // Auto-fetch today's weather for admin if no record today
          if (user?.role === 'admin') {
            const today = new Date().toISOString().slice(0, 10)
            const hasToday = records.some((r) => r.date === today)
            if (!hasToday) {
              // Defer so state is settled
              setTimeout(() => {
                if (active) {
                  handleFetchWeatherForSite(siteData as SiteRow)
                }
              }, 0)
            }
          }
        }
      }

      setLoading(false)
    }

    fetchData()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Deduplicate: per date keep only the latest auto record.
  // Manual records are returned separately for orange-dot overlay.
  const { chartData, manualChartData } = useMemo(() => {
    const sorted = [...weather].sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : (a.created_at ?? '').localeCompare(b.created_at ?? '')
    )
    // Latest auto per date (last wins after sort by created_at asc)
    const autoByDate = new Map<string, WeatherRecord>()
    const manuals: WeatherRecord[] = []
    for (const r of sorted) {
      if (r.source === 'manual') { manuals.push(r) }
      else { autoByDate.set(r.date, r) }
    }
    const autoSorted = [...autoByDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
    return { chartData: autoSorted, manualChartData: manuals }
  }, [weather])

  // Shared fetch logic (also called from useEffect on mount)
  async function handleFetchWeatherForSite(targetSite: SiteRow) {
    setSaving(true)
    setError(null)
    try {
      const data = await fetchCurrentWeather(targetSite.latitude, targetSite.longitude)
      const { data: authData } = await supabase.auth.getUser()
      const payload = {
        site_id: targetSite.id,
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

      // Prune to 30 records
      await pruneOldRecords(targetSite.id)

      // Refresh full list after prune
      const { data: freshData } = await supabase
        .from('weather_records')
        .select('*')
        .eq('site_id', targetSite.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (freshData) {
        setWeather(freshData.map((row) => normalizeWeatherRecord(row as WeatherRow)))
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : '获取天气数据失败'
      setError(message)
      alert('获取天气数据失败')
    } finally {
      setSaving(false)
    }
  }

  const handleFetchWeather = async () => {
    if (!site) return
    await handleFetchWeatherForSite(site)
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

      // Prune to 30 records
      await pruneOldRecords(site.id)

      // Refresh full list after prune
      const { data: freshData } = await supabase
        .from('weather_records')
        .select('*')
        .eq('site_id', site.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (freshData) {
        setWeather(freshData.map((row) => normalizeWeatherRecord(row as WeatherRow)))
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

  const handleExportCSV = () => {
    if (!site || weather.length === 0) return
    const header = '日期,温度(°C),最低温,最高温,降雨(mm),湿度(%),风速(m/s),天气,来源'
    const rows = [...weather]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((w) =>
        [
          w.date,
          w.temperature ?? '',
          w.temperature_min ?? '',
          w.temperature_max ?? '',
          w.rainfall ?? '',
          w.humidity ?? '',
          w.wind_speed ?? '',
          w.weather_desc ?? '',
          w.source ?? '',
        ].join(',')
      )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${site.name_cn}_天气数据.csv`
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

      {/* 4-panel chart grid */}
      <div className="grid grid-cols-2 gap-4">
        <MiniChart
          data={chartData}
          field="temperature"
          color="#ef4444"
          gradientId="grad_temp"
          type="line"
          label="温度(°C)"
          overlayData={manualChartData}
        />
        <MiniChart
          data={chartData}
          field="rainfall"
          color="#3b82f6"
          gradientId="grad_rain"
          type="bar"
          label="降雨(mm)"
          overlayData={manualChartData}
        />
        <MiniChart
          data={chartData}
          field="humidity"
          color="#06b6d4"
          gradientId="grad_humi"
          type="line"
          label="湿度(%)"
          overlayData={manualChartData}
        />
        <MiniChart
          data={chartData}
          field="wind_speed"
          color="#8b5cf6"
          gradientId="grad_wind"
          type="line"
          label="风速(m/s)"
          overlayData={manualChartData}
        />
      </div>
      {manualChartData.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-gray-400 rounded" /> 自动采集
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-orange-400" /> 手动补充
          </span>
        </div>
      )}

      {/* Weather records table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">天气记录</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={weather.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              导出CSV
            </button>
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
