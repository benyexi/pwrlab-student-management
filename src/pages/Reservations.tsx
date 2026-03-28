import { useState, useMemo } from 'react'
import { Wrench, Search, Plus, X, Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { DEMO_INSTRUMENTS, DEMO_RESERVATIONS } from '../data/demo'
import type { Reservation, Instrument } from '../types'

const STATUS_COLORS: Record<string, string> = {
  '待审批': 'bg-amber-50 text-amber-600',
  '已批准': 'bg-green-50 text-green-600',
  '已拒绝': 'bg-red-50 text-red-600',
  '已完成': 'bg-gray-100 text-gray-500',
  '已取消': 'bg-gray-50 text-gray-400',
}

const INSTRUMENT_STATUS_COLORS: Record<string, string> = {
  '可用': 'bg-green-50 text-green-600',
  '使用中': 'bg-blue-50 text-blue-600',
  '维修中': 'bg-red-50 text-red-600',
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>(DEMO_RESERVATIONS)
  const [instruments] = useState<Instrument[]>(DEMO_INSTRUMENTS)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [form, setForm] = useState({
    instrument_id: '',
    start_date: '',
    end_date: '',
    purpose: '',
  })

  // Calendar logic
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [calendarMonth])

  const getReservationsForDay = (day: number) => {
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return reservations.filter((r) => r.status !== '已取消' && r.status !== '已拒绝' && dateStr >= r.start_date && dateStr <= r.end_date)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const inst = instruments.find((i) => i.id === form.instrument_id)
    // Check conflicts
    const conflict = reservations.some(
      (r) =>
        r.instrument_id === form.instrument_id &&
        r.status !== '已取消' &&
        r.status !== '已拒绝' &&
        form.start_date <= r.end_date &&
        form.end_date >= r.start_date
    )
    if (conflict) {
      alert('该时间段已有预约，请选择其他时间')
      return
    }
    const newRes: Reservation = {
      id: `res_${Date.now()}`,
      instrument_id: form.instrument_id,
      instrument_name: inst?.name || '',
      student_id: 'current',
      student_name: '当前用户',
      start_date: form.start_date,
      end_date: form.end_date,
      purpose: form.purpose,
      status: '待审批',
    }
    setReservations((prev) => [...prev, newRes])
    setShowForm(false)
    setForm({ instrument_id: '', start_date: '', end_date: '', purpose: '' })
  }

  const filtered = reservations.filter(
    (r) => r.instrument_name.includes(search) || r.student_name.includes(search) || r.purpose.includes(search)
  )

  const monthName = calendarMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪器预约</h1>
          <p className="text-gray-500 text-sm mt-1">共 {instruments.length} 台仪器</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? '取消' : '新建预约'}
        </button>
      </div>

      {/* Instrument Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {instruments.map((inst) => (
          <div key={inst.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <Wrench className="w-4 h-4 text-gray-400" />
              <span className={`px-2 py-0.5 rounded-full text-xs ${INSTRUMENT_STATUS_COLORS[inst.status]}`}>{inst.status}</span>
            </div>
            <h3 className="font-medium text-sm text-gray-900 truncate">{inst.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{inst.model}</p>
            {inst.location && <p className="text-xs text-gray-400">{inst.location}</p>}
          </div>
        ))}
      </div>

      {/* Reservation Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-4">新建预约</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">仪器</label>
                <select value={form.instrument_id} onChange={(e) => setForm({ ...form, instrument_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                  <option value="">选择仪器</option>
                  {instruments.filter((i) => i.status !== '维修中').map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">开始日期</label>
                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">结束日期</label>
                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">用途说明</label>
                <input type="text" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="预约用途" required />
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">提交预约</button>
          </form>
        </div>
      )}

      {/* Calendar View */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" />预约日历
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              className="p-1.5 hover:bg-gray-100 rounded"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-medium min-w-[120px] text-center">{monthName}</span>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              className="p-1.5 hover:bg-gray-100 rounded"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
            <div key={d} className="bg-gray-50 text-center text-xs text-gray-500 py-2 font-medium">{d}</div>
          ))}
          {calendarDays.map((day, i) => {
            const dayReservations = day ? getReservationsForDay(day) : []
            const isToday = day === new Date().getDate() && calendarMonth.getMonth() === new Date().getMonth() && calendarMonth.getFullYear() === new Date().getFullYear()
            return (
              <div key={i} className={`bg-white min-h-[60px] p-1 ${!day ? 'bg-gray-50' : ''}`}>
                {day && (
                  <>
                    <span className={`text-xs ${isToday ? 'bg-green-600 text-white w-5 h-5 rounded-full inline-flex items-center justify-center' : 'text-gray-600'}`}>
                      {day}
                    </span>
                    {dayReservations.slice(0, 2).map((r) => (
                      <div key={r.id} className="mt-0.5 text-[10px] px-1 py-0.5 rounded bg-green-50 text-green-700 truncate" title={`${r.instrument_name} - ${r.student_name}`}>
                        {r.instrument_name.slice(0, 6)}
                      </div>
                    ))}
                    {dayReservations.length > 2 && (
                      <div className="text-[10px] text-gray-400 px-1">+{dayReservations.length - 2}</div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Reservation List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-semibold text-gray-900">预约记录</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="搜索..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">仪器</th>
                <th className="px-4 py-3 text-left">预约人</th>
                <th className="px-4 py-3 text-left">日期范围</th>
                <th className="px-4 py-3 text-left">用途</th>
                <th className="px-4 py-3 text-center">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.instrument_name}</td>
                  <td className="px-4 py-3">{r.student_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.start_date} ~ {r.end_date}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{r.purpose}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                      {r.status}
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
