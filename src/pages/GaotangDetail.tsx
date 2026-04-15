import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const GAOTANG_SITE_ID = 's12'

const STANDS = [
  '灌溉管理试验林',
  '水肥耦合与间伐试验林',
  '除草试验林',
  '抹芽试验林',
  '修枝试验林',
  '结构调控与水分调控试验林',
  '减雨控制试验林',
  '纸浆林经营示范林',
  '大径材林经营示范林',
  '多树种灌溉响应试验林',
]

const DATA_MODULES = [
  '林地管理', '土壤水分', '树干液流', '树木生长', '气象与地下水',
  '实验设计', '根系数据', '光合生理', '水力性状',
]

// ─── Types ───────────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown> & { id: string; created_at: string }

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent'
const selectCls = `${inputCls} bg-white`

function SaveBtn({ saving }: { saving: boolean }) {
  return (
    <button type="submit" disabled={saving}
      className="px-5 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-50">
      {saving ? '保存中…' : '保存'}
    </button>
  )
}

// ─── Module components ────────────────────────────────────────────────────────

// Module 1: 林地管理
function ForestMgmtModule({ stand, user }: { stand: string; user: { id: string; name: string } }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ op_type: '灌溉', start_time: '', end_time: '', water_meter: '', operator: user.name, notes: '' })

  useEffect(() => {
    supabase.from('gaotang_forest_mgmt').select('*').eq('stand_name', stand)
      .order('start_time', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as AnyRecord[]))
  }, [stand])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.from('gaotang_forest_mgmt').insert({
      stand_name: stand, op_type: form.op_type,
      start_time: form.start_time, end_time: form.end_time || null,
      water_meter: form.op_type === '灌溉' && form.water_meter ? parseFloat(form.water_meter) : null,
      operator: form.operator, notes: form.notes || null,
      created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) { setRows(prev => [data as AnyRecord, ...prev]); setShow(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {rows.length} 条记录</p>
        <button onClick={() => setShow(!show)} className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">
          {show ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{show ? '取消' : '新增'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="操作类型">
              <select value={form.op_type} onChange={e => setForm(f => ({ ...f, op_type: e.target.value }))} className={selectCls} required>
                {['灌溉','修枝','施肥','除草','打药','其他'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="操作人">
              <input value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} required />
            </Field>
            <Field label="开始时间">
              <input type="datetime-local" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className={inputCls} required />
            </Field>
            <Field label="结束时间">
              <input type="datetime-local" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className={inputCls} />
            </Field>
            {form.op_type === '灌溉' && (
              <Field label="水表读数">
                <input type="number" step="0.01" value={form.water_meter} onChange={e => setForm(f => ({ ...f, water_meter: e.target.value }))} className={inputCls} />
              </Field>
            )}
            <Field label="备注">
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
            </Field>
          </div>
          <div className="flex justify-end"><SaveBtn saving={saving} /></div>
        </form>
      )}
      <RecordTable rows={rows} cols={[
        { key: 'op_type', label: '操作类型' },
        { key: 'start_time', label: '开始时间', render: v => String(v).slice(0, 16) },
        { key: 'water_meter', label: '水表读数', render: v => v != null ? String(v) : '—' },
        { key: 'operator', label: '操作人' },
      ]} />
    </div>
  )
}

// Module 2: 土壤水分
function SoilMoistureModule({ stand, user }: { stand: string; user: { id: string; name: string } }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ record_type: '手动TRIME', record_date: today(), operator: user.name, location: '', jianguoyun_path: '', maintenance_type: '日常', instrument_name: '', description: '', notes: '' })

  useEffect(() => {
    supabase.from('gaotang_soil_moisture').select('*').eq('stand_name', stand)
      .order('record_date', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as AnyRecord[]))
  }, [stand])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const isMaint = form.record_type === '仪器维护'
    const { data, error } = await supabase.from('gaotang_soil_moisture').insert({
      stand_name: stand, record_type: form.record_type, record_date: form.record_date, operator: form.operator,
      location: !isMaint ? form.location || null : null,
      jianguoyun_path: !isMaint ? form.jianguoyun_path || null : null,
      maintenance_type: isMaint ? form.maintenance_type : null,
      instrument_name: isMaint ? form.instrument_name || null : null,
      description: isMaint ? form.description || null : null,
      notes: form.notes || null, created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) { setRows(prev => [data as AnyRecord, ...prev]); setShow(false) }
  }

  const isMaint = form.record_type === '仪器维护'
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {rows.length} 条记录</p>
        <button onClick={() => setShow(!show)} className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">
          {show ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{show ? '取消' : '新增'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="记录类型">
              <select value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))} className={selectCls} required>
                {['手动TRIME','FDR自动','仪器维护'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="日期"><input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} className={inputCls} required /></Field>
            <Field label="操作人"><input value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} required /></Field>
            {!isMaint && <>
              <Field label="测定点位/时间范围"><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className={inputCls} /></Field>
              <Field label="坚果云路径"><input value={form.jianguoyun_path} onChange={e => setForm(f => ({ ...f, jianguoyun_path: e.target.value }))} className={inputCls} /></Field>
            </>}
            {isMaint && <>
              <Field label="维护类型">
                <select value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))} className={selectCls}>
                  <option>日常</option><option>故障</option>
                </select>
              </Field>
              <Field label="仪器名称"><input value={form.instrument_name} onChange={e => setForm(f => ({ ...f, instrument_name: e.target.value }))} className={inputCls} /></Field>
              <Field label="描述"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
            </>}
            <Field label="备注"><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} /></Field>
          </div>
          <div className="flex justify-end"><SaveBtn saving={saving} /></div>
        </form>
      )}
      <RecordTable rows={rows} cols={[
        { key: 'record_type', label: '类型' }, { key: 'record_date', label: '日期' },
        { key: 'operator', label: '操作人' },
        { key: 'jianguoyun_path', label: '坚果云路径', render: v => v ? <span className="text-blue-600 text-xs truncate max-w-[160px] block">{String(v)}</span> : '—' },
      ]} />
    </div>
  )
}

// Module 3: 树干液流
function SapflowModule({ stand, user }: { stand: string; user: { id: string; name: string } }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    record_type: '探针安装', record_date: today(), operator: user.name,
    probe_id: '', direction: 'N', install_height_cm: '', install_diameter_mm: '',
    tree_id: '', dbh_cm: '', tree_height_m: '', crown_width_m: '', branch_height_m: '',
    time_range: '', jianguoyun_path: '', maintenance_type: '日常', description: '', notes: '',
  })

  useEffect(() => {
    supabase.from('gaotang_sapflow').select('*').eq('stand_name', stand)
      .order('record_date', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as AnyRecord[]))
  }, [stand])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const isInstall = form.record_type === '探针安装'
    const isData = form.record_type === '数据采集'
    const isMaint = form.record_type === '仪器维护'
    const { data, error } = await supabase.from('gaotang_sapflow').insert({
      stand_name: stand, record_type: form.record_type, record_date: form.record_date, operator: form.operator,
      probe_id: (isInstall || isMaint) ? form.probe_id || null : null,
      direction: isInstall ? form.direction : null,
      install_height_cm: isInstall && form.install_height_cm ? parseFloat(form.install_height_cm) : null,
      install_diameter_mm: isInstall && form.install_diameter_mm ? parseFloat(form.install_diameter_mm) : null,
      tree_id: isInstall ? form.tree_id || null : null,
      dbh_cm: isInstall && form.dbh_cm ? parseFloat(form.dbh_cm) : null,
      tree_height_m: isInstall && form.tree_height_m ? parseFloat(form.tree_height_m) : null,
      crown_width_m: isInstall && form.crown_width_m ? parseFloat(form.crown_width_m) : null,
      branch_height_m: isInstall && form.branch_height_m ? parseFloat(form.branch_height_m) : null,
      time_range: isData ? form.time_range || null : null,
      jianguoyun_path: isData ? form.jianguoyun_path || null : null,
      maintenance_type: isMaint ? form.maintenance_type : null,
      description: isMaint ? form.description || null : null,
      notes: form.notes || null, created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) { setRows(prev => [data as AnyRecord, ...prev]); setShow(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {rows.length} 条记录</p>
        <button onClick={() => setShow(!show)} className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">
          {show ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{show ? '取消' : '新增'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="记录类型">
              <select value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))} className={selectCls} required>
                {['探针安装','数据采集','仪器维护'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="日期"><input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} className={inputCls} required /></Field>
            <Field label="操作人"><input value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} required /></Field>
            {form.record_type === '探针安装' && <>
              <Field label="探针编号"><input value={form.probe_id} onChange={e => setForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="方位">
                <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} className={selectCls}>
                  {['N','S','E','W'].map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="安装高度(cm)"><input type="number" step="0.1" value={form.install_height_cm} onChange={e => setForm(f => ({ ...f, install_height_cm: e.target.value }))} className={inputCls} /></Field>
              <Field label="安装处直径(mm)"><input type="number" step="0.1" value={form.install_diameter_mm} onChange={e => setForm(f => ({ ...f, install_diameter_mm: e.target.value }))} className={inputCls} /></Field>
              <Field label="样树编号"><input value={form.tree_id} onChange={e => setForm(f => ({ ...f, tree_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="胸径(cm)"><input type="number" step="0.1" value={form.dbh_cm} onChange={e => setForm(f => ({ ...f, dbh_cm: e.target.value }))} className={inputCls} /></Field>
              <Field label="树高(m)"><input type="number" step="0.1" value={form.tree_height_m} onChange={e => setForm(f => ({ ...f, tree_height_m: e.target.value }))} className={inputCls} /></Field>
              <Field label="冠幅(m)"><input type="number" step="0.1" value={form.crown_width_m} onChange={e => setForm(f => ({ ...f, crown_width_m: e.target.value }))} className={inputCls} /></Field>
              <Field label="枝下高(m)"><input type="number" step="0.1" value={form.branch_height_m} onChange={e => setForm(f => ({ ...f, branch_height_m: e.target.value }))} className={inputCls} /></Field>
            </>}
            {form.record_type === '数据采集' && <>
              <Field label="数据时间范围"><input value={form.time_range} onChange={e => setForm(f => ({ ...f, time_range: e.target.value }))} className={inputCls} /></Field>
              <Field label="坚果云路径"><input value={form.jianguoyun_path} onChange={e => setForm(f => ({ ...f, jianguoyun_path: e.target.value }))} className={inputCls} /></Field>
            </>}
            {form.record_type === '仪器维护' && <>
              <Field label="维护类型"><select value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))} className={selectCls}><option>日常</option><option>故障</option></select></Field>
              <Field label="探针编号"><input value={form.probe_id} onChange={e => setForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="描述"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
            </>}
            <Field label="备注"><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} /></Field>
          </div>
          <div className="flex justify-end"><SaveBtn saving={saving} /></div>
        </form>
      )}
      <RecordTable rows={rows} cols={[
        { key: 'record_type', label: '类型' }, { key: 'record_date', label: '日期' },
        { key: 'operator', label: '操作人' }, { key: 'probe_id', label: '探针', render: v => v ? String(v) : '—' },
        { key: 'tree_id', label: '样树', render: v => v ? String(v) : '—' },
      ]} />
    </div>
  )
}

// Module 4: 树木生长 (simplified - similar pattern)
function TreeGrowthModule({ stand, user }: { stand: string; user: { id: string; name: string } }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ record_type: '每木检尺', record_date: today(), operator: user.name, tree_id: '', dbh_cm: '', tree_height_m: '', branch_height_m: '', crown_width_m: '', probe_id: '', direction: 'N', install_height_cm: '', time_range: '', jianguoyun_path: '', maintenance_type: '日常', description: '', notes: '' })

  useEffect(() => {
    supabase.from('gaotang_tree_growth').select('*').eq('stand_name', stand).order('record_date', { ascending: false }).then(({ data }) => setRows((data ?? []) as AnyRecord[]))
  }, [stand])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const isMeasure = form.record_type === '每木检尺'
    const isInstall = form.record_type === '茎干传感器安装'
    const isData = form.record_type === '茎干传感器数采'
    const isMaint = form.record_type === '茎干传感器维护'
    const { data, error } = await supabase.from('gaotang_tree_growth').insert({
      stand_name: stand, record_type: form.record_type, record_date: form.record_date, operator: form.operator,
      tree_id: (isMeasure || isInstall) ? form.tree_id || null : null,
      dbh_cm: isMeasure && form.dbh_cm ? parseFloat(form.dbh_cm) : null,
      tree_height_m: isMeasure && form.tree_height_m ? parseFloat(form.tree_height_m) : null,
      branch_height_m: isMeasure && form.branch_height_m ? parseFloat(form.branch_height_m) : null,
      crown_width_m: isMeasure && form.crown_width_m ? parseFloat(form.crown_width_m) : null,
      probe_id: (isInstall || isMaint) ? form.probe_id || null : null,
      direction: isInstall ? form.direction : null,
      install_height_cm: isInstall && form.install_height_cm ? parseFloat(form.install_height_cm) : null,
      time_range: isData ? form.time_range || null : null,
      jianguoyun_path: isData ? form.jianguoyun_path || null : null,
      maintenance_type: isMaint ? form.maintenance_type : null,
      description: (isMaint || isData) ? form.description || null : null,
      notes: form.notes || null, created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) { setRows(prev => [data as AnyRecord, ...prev]); setShow(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {rows.length} 条记录</p>
        <button onClick={() => setShow(!show)} className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">
          {show ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{show ? '取消' : '新增'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="记录类型">
              <select value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))} className={selectCls} required>
                {['每木检尺','茎干传感器安装','茎干传感器数采','茎干传感器维护'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="日期"><input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} className={inputCls} required /></Field>
            <Field label="操作人"><input value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} required /></Field>
            {form.record_type === '每木检尺' && <>
              <Field label="样树编号"><input value={form.tree_id} onChange={e => setForm(f => ({ ...f, tree_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="胸径(cm)"><input type="number" step="0.1" value={form.dbh_cm} onChange={e => setForm(f => ({ ...f, dbh_cm: e.target.value }))} className={inputCls} /></Field>
              <Field label="树高(m)"><input type="number" step="0.1" value={form.tree_height_m} onChange={e => setForm(f => ({ ...f, tree_height_m: e.target.value }))} className={inputCls} /></Field>
              <Field label="枝下高(m)"><input type="number" step="0.1" value={form.branch_height_m} onChange={e => setForm(f => ({ ...f, branch_height_m: e.target.value }))} className={inputCls} /></Field>
              <Field label="冠幅(m)"><input type="number" step="0.1" value={form.crown_width_m} onChange={e => setForm(f => ({ ...f, crown_width_m: e.target.value }))} className={inputCls} /></Field>
            </>}
            {form.record_type === '茎干传感器安装' && <>
              <Field label="样树编号"><input value={form.tree_id} onChange={e => setForm(f => ({ ...f, tree_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="传感器编号"><input value={form.probe_id} onChange={e => setForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="方位"><select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} className={selectCls}>{['N','S','E','W'].map(d => <option key={d}>{d}</option>)}</select></Field>
              <Field label="安装高度(cm)"><input type="number" step="0.1" value={form.install_height_cm} onChange={e => setForm(f => ({ ...f, install_height_cm: e.target.value }))} className={inputCls} /></Field>
            </>}
            {form.record_type === '茎干传感器数采' && <>
              <Field label="数据时间范围"><input value={form.time_range} onChange={e => setForm(f => ({ ...f, time_range: e.target.value }))} className={inputCls} /></Field>
              <Field label="坚果云路径"><input value={form.jianguoyun_path} onChange={e => setForm(f => ({ ...f, jianguoyun_path: e.target.value }))} className={inputCls} /></Field>
            </>}
            {form.record_type === '茎干传感器维护' && <>
              <Field label="传感器编号"><input value={form.probe_id} onChange={e => setForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="维护类型"><select value={form.maintenance_type} onChange={e => setForm(f => ({ ...f, maintenance_type: e.target.value }))} className={selectCls}><option>日常</option><option>故障</option></select></Field>
              <Field label="描述"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
            </>}
            <Field label="备注"><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} /></Field>
          </div>
          <div className="flex justify-end"><SaveBtn saving={saving} /></div>
        </form>
      )}
      <RecordTable rows={rows} cols={[
        { key: 'record_type', label: '类型' }, { key: 'record_date', label: '日期' },
        { key: 'operator', label: '操作人' }, { key: 'tree_id', label: '样树', render: v => v ? String(v) : '—' },
        { key: 'dbh_cm', label: 'DBH(cm)', render: v => v ? String(v) : '—' },
      ]} />
    </div>
  )
}

// Generic simple module factory
function SimpleModule({
  stand, user, tableName, fields, cols,
}: {
  stand: string
  user: { id: string; name: string }
  tableName: string
  fields: { key: string; label: string; type?: string; options?: string[] }[]
  cols: { key: string; label: string; render?: (v: unknown) => React.ReactNode }[]
}) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const initForm = () => {
    const f: Record<string, string> = { operator: user.name }
    fields.forEach(field => { f[field.key] = field.options ? field.options[0] : (field.key.includes('date') ? today() : '') })
    return f
  }
  const [form, setForm] = useState<Record<string, string>>(initForm)

  useEffect(() => {
    supabase.from(tableName).select('*').eq('stand_name', stand).order('created_at', { ascending: false }).then(({ data }) => setRows((data ?? []) as AnyRecord[]))
  }, [stand, tableName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    const payload: Record<string, unknown> = { stand_name: stand, created_by: user.id }
    fields.forEach(field => {
      const v = form[field.key]
      payload[field.key] = v || null
    })
    const { data, error } = await supabase.from(tableName).insert(payload).select('*').single()
    setSaving(false)
    if (!error && data) { setRows(prev => [data as AnyRecord, ...prev]); setShow(false); setForm(initForm()) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">共 {rows.length} 条记录</p>
        <button onClick={() => setShow(!show)} className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">
          {show ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{show ? '取消' : '新增'}
        </button>
      </div>
      {show && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {fields.map(field => (
              <Field key={field.key} label={field.label}>
                {field.options ? (
                  <select value={form[field.key] ?? ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className={selectCls}>
                    {field.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type ?? 'text'}
                    value={form[field.key] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className={inputCls}
                    step={field.type === 'number' ? '0.01' : undefined}
                  />
                )}
              </Field>
            ))}
          </div>
          <div className="flex justify-end"><SaveBtn saving={saving} /></div>
        </form>
      )}
      <RecordTable rows={rows} cols={cols} />
    </div>
  )
}

// ─── Record table ─────────────────────────────────────────────────────────────

function RecordTable({ rows, cols }: {
  rows: AnyRecord[]
  cols: { key: string; label: string; render?: (v: unknown) => React.ReactNode }[]
}) {
  if (rows.length === 0) {
    return <p className="text-center py-8 text-sm text-gray-400">暂无记录</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs">
          <tr>{cols.map(c => <th key={c.key} className="px-3 py-2 text-left whitespace-nowrap">{c.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {cols.map(c => (
                <td key={c.key} className="px-3 py-2 text-gray-700">
                  {c.render ? c.render(row[c.key]) : (row[c.key] != null ? String(row[c.key]) : '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function today() { return new Date().toISOString().slice(0, 10) }

// ─── Module renderer ──────────────────────────────────────────────────────────

function ModuleContent({ moduleIndex, stand, user }: {
  moduleIndex: number
  stand: string
  user: { id: string; name: string }
}) {
  switch (moduleIndex) {
    case 0: return <ForestMgmtModule stand={stand} user={user} />
    case 1: return <SoilMoistureModule stand={stand} user={user} />
    case 2: return <SapflowModule stand={stand} user={user} />
    case 3: return <TreeGrowthModule stand={stand} user={user} />
    case 4: return (
      <SimpleModule stand={stand} user={user} tableName="gaotang_meteo"
        fields={[
          { key: 'record_type', label: '记录类型', options: ['气象站采集','气象站维护','手动地下水位'] },
          { key: 'record_date', label: '日期', type: 'date' },
          { key: 'operator', label: '操作人' },
          { key: 'time_range', label: '数据时间范围' },
          { key: 'jianguoyun_path', label: '坚果云路径' },
          { key: 'description', label: '维护描述' },
          { key: 'measurement_point', label: '测定点位' },
          { key: 'water_level_m', label: '水位(m)', type: 'number' },
          { key: 'notes', label: '备注' },
        ]}
        cols={[
          { key: 'record_type', label: '类型' }, { key: 'record_date', label: '日期' },
          { key: 'operator', label: '操作人' },
          { key: 'water_level_m', label: '水位(m)', render: v => v != null ? String(v) : '—' },
          { key: 'jianguoyun_path', label: '坚果云路径', render: v => v ? <span className="text-blue-600 text-xs">{String(v)}</span> : '—' },
        ]}
      />
    )
    case 5: return (
      <SimpleModule stand={stand} user={user} tableName="gaotang_experiment"
        fields={[
          { key: 'treatment_count', label: '处理数', type: 'number' },
          { key: 'replicate_count', label: '重复数', type: 'number' },
          { key: 'treatment_id', label: '处理编号' },
          { key: 'treatment_name', label: '处理名称' },
          { key: 'measures', label: '具体措施' },
          { key: 'design_image_path', label: '设计图坚果云路径' },
          { key: 'notes', label: '备注' },
        ]}
        cols={[
          { key: 'treatment_id', label: '编号' }, { key: 'treatment_name', label: '处理名称' },
          { key: 'treatment_count', label: '处理数' }, { key: 'replicate_count', label: '重复数' },
          { key: 'measures', label: '措施', render: v => v ? <span className="truncate max-w-[200px] block">{String(v)}</span> : '—' },
        ]}
      />
    )
    case 6: return (
      <SimpleModule stand={stand} user={user} tableName="gaotang_roots"
        fields={[
          { key: 'measure_type', label: '测定类型', options: ['微根管','土钻挖根'] },
          { key: 'measure_date', label: '测定日期', type: 'date' },
          { key: 'operator', label: '操作人' },
          { key: 'indicator', label: '测定指标（根长密度/根生物量等）' },
          { key: 'jianguoyun_path', label: '坚果云路径' },
          { key: 'notes', label: '备注' },
        ]}
        cols={[
          { key: 'measure_type', label: '类型' }, { key: 'measure_date', label: '日期' },
          { key: 'operator', label: '操作人' }, { key: 'indicator', label: '测定指标' },
          { key: 'jianguoyun_path', label: '坚果云路径', render: v => v ? <span className="text-blue-600 text-xs">{String(v)}</span> : '—' },
        ]}
      />
    )
    case 7: return (
      <SimpleModule stand={stand} user={user} tableName="gaotang_photosynthesis"
        fields={[
          { key: 'measure_date', label: '测定日期', type: 'date' },
          { key: 'operator', label: '操作人' },
          { key: 'instrument', label: '测定仪器' },
          { key: 'indicator', label: '测定指标（净光合/气孔导度/蒸腾/WUE等）' },
          { key: 'measure_condition', label: '测定条件' },
          { key: 'jianguoyun_path', label: '坚果云路径' },
          { key: 'notes', label: '备注' },
        ]}
        cols={[
          { key: 'measure_date', label: '日期' }, { key: 'operator', label: '操作人' },
          { key: 'instrument', label: '仪器' }, { key: 'indicator', label: '指标' },
          { key: 'jianguoyun_path', label: '坚果云路径', render: v => v ? <span className="text-blue-600 text-xs">{String(v)}</span> : '—' },
        ]}
      />
    )
    case 8: return (
      <SimpleModule stand={stand} user={user} tableName="gaotang_hydraulics"
        fields={[
          { key: 'measure_date', label: '测定日期', type: 'date' },
          { key: 'operator', label: '操作人' },
          { key: 'organ_type', label: '器官类型', options: ['根系','枝条','叶片'] },
          { key: 'indicator', label: '测定指标（导水率/P50/P88/TLP等）' },
          { key: 'measure_method', label: '测定方法' },
          { key: 'jianguoyun_path', label: '坚果云路径' },
          { key: 'notes', label: '备注' },
        ]}
        cols={[
          { key: 'measure_date', label: '日期' }, { key: 'operator', label: '操作人' },
          { key: 'organ_type', label: '器官' }, { key: 'indicator', label: '指标' },
          { key: 'measure_method', label: '方法' },
        ]}
      />
    )
    default: return null
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GaotangDetail() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [site, setSite] = useState<{ name_cn: string; name_en: string; latitude: number; longitude: number; elevation: number } | null>(null)
  const [activeStand, setActiveStand] = useState(0)
  const [activeModule, setActiveModule] = useState(0)
  const [standDropOpen, setStandDropOpen] = useState(false)

  useEffect(() => { document.title = '高唐站点 | PWRlab' }, [])

  useEffect(() => {
    supabase.from('sites').select('name_cn,name_en,latitude,longitude,elevation').eq('id', GAOTANG_SITE_ID).maybeSingle()
      .then(({ data }) => { if (data) setSite(data as typeof site) })
  }, [])

  if (!user) return null
  const currentUser = { id: user.id, name: user.name }
  const stand = STANDS[activeStand]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sites')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{site?.name_cn ?? '高唐站点'}</h1>
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full font-medium">主站点</span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {site ? `${site.latitude.toFixed(3)}°N, ${site.longitude.toFixed(3)}°E · 海拔 ${site.elevation}m` : ''}
          </p>
        </div>
      </div>

      {/* Stand selector */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">选择林分</p>
        {/* Mobile: dropdown */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setStandDropOpen(!standDropOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm font-medium text-gray-800 bg-gray-50"
          >
            <span>{STANDS[activeStand]}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${standDropOpen ? 'rotate-180' : ''}`} />
          </button>
          {standDropOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-10 overflow-hidden">
              {STANDS.map((s, i) => (
                <button key={i} onClick={() => { setActiveStand(i); setActiveModule(0); setStandDropOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 ${i === activeStand ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                  {i + 1}. {s}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Desktop: tab pills */}
        <div className="hidden sm:flex flex-wrap gap-2">
          {STANDS.map((s, i) => (
            <button key={i} onClick={() => { setActiveStand(i); setActiveModule(0) }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${i === activeStand ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>
      </div>

      {/* Data module tabs + content */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Module tab bar */}
        <div className="border-b overflow-x-auto">
          <div className="flex min-w-max">
            {DATA_MODULES.map((m, i) => (
              <button key={i} onClick={() => setActiveModule(i)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${i === activeModule ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {i + 1}. {m}
              </button>
            ))}
          </div>
        </div>

        {/* Module content */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{DATA_MODULES[activeModule]}</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{stand}</span>
          </div>
          <ModuleContent moduleIndex={activeModule} stand={stand} user={currentUser} />
        </div>
      </div>
    </div>
  )
}
