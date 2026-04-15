import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

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

type AuthUser = { id: string; name: string; role: 'admin' | 'student' }
type AnyRecord = Record<string, unknown> & { id: string; created_at?: string }

type TreeRow = {
  _key: string
  id?: string
  sample_no: string
  dbh: string
  tree_height: string
  crown_height: string
  crown_width: string
  _dirty?: boolean
}

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

function today() { return new Date().toISOString().slice(0, 10) }

function makeTreeRow(seed?: Partial<TreeRow>): TreeRow {
  return {
    _key: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`,
    sample_no: '',
    dbh: '',
    tree_height: '',
    crown_height: '',
    crown_width: '',
    ...seed,
  }
}

function createStandScopedQuery(tableName: string, stand: string, user: AuthUser, standColumn = 'stand_name') {
  let query = supabase.from(tableName).select('*').eq(standColumn, stand)
  if (user.role !== 'admin') {
    query = query.eq('created_by', user.id)
  }
  return query
}

async function deleteById(tableName: string, id: string) {
  return supabase.from(tableName).delete().eq('id', id)
}

function ForestMgmtModule({ stand, user }: { stand: string; user: AuthUser }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ op_type: '灌溉', start_time: '', end_time: '', water_meter: '', operator: user.name, notes: '' })

  const loadRows = async () => {
    const { data } = await createStandScopedQuery('gaotang_forest_mgmt', stand, user)
      .order('start_time', { ascending: false })
    setRows((data ?? []) as AnyRecord[])
  }

  useEffect(() => {
    loadRows()
  }, [stand, user.id, user.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await supabase.from('gaotang_forest_mgmt').insert({
      stand_name: stand,
      op_type: form.op_type,
      start_time: form.start_time,
      end_time: form.end_time || null,
      water_meter: form.op_type === '灌溉' && form.water_meter ? parseFloat(form.water_meter) : null,
      operator: form.operator,
      notes: form.notes || null,
      created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) {
      await loadRows()
      setShow(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteById('gaotang_forest_mgmt', id)
    if (!error) await loadRows()
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
                {['灌溉', '修枝', '施肥', '除草', '打药', '其他'].map(t => <option key={t}>{t}</option>)}
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
      <RecordTable
        rows={rows}
        cols={[
          { key: 'op_type', label: '操作类型' },
          { key: 'start_time', label: '开始时间', render: v => String(v).slice(0, 16) },
          { key: 'water_meter', label: '水表读数', render: v => v != null ? String(v) : '—' },
          { key: 'operator', label: '操作人' },
        ]}
        canDelete={user.role === 'admin'}
        onDelete={handleDelete}
      />
    </div>
  )
}

function SoilMoistureModule({ stand, user }: { stand: string; user: AuthUser }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ record_type: '手动TRIME', record_date: today(), operator: user.name, location: '', jianguoyun_path: '', maintenance_type: '日常', instrument_name: '', description: '', notes: '' })

  const loadRows = async () => {
    const { data } = await createStandScopedQuery('gaotang_soil_moisture', stand, user)
      .order('record_date', { ascending: false })
    setRows((data ?? []) as AnyRecord[])
  }

  useEffect(() => {
    loadRows()
  }, [stand, user.id, user.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const isMaint = form.record_type === '仪器维护'
    const { data, error } = await supabase.from('gaotang_soil_moisture').insert({
      stand_name: stand,
      record_type: form.record_type,
      record_date: form.record_date,
      operator: form.operator,
      location: !isMaint ? form.location || null : null,
      jianguoyun_path: !isMaint ? form.jianguoyun_path || null : null,
      maintenance_type: isMaint ? form.maintenance_type : null,
      instrument_name: isMaint ? form.instrument_name || null : null,
      description: isMaint ? form.description || null : null,
      notes: form.notes || null,
      created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) {
      await loadRows()
      setShow(false)
    }
  }

  const isMaint = form.record_type === '仪器维护'

  const handleDelete = async (id: string) => {
    const { error } = await deleteById('gaotang_soil_moisture', id)
    if (!error) await loadRows()
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
                {['手动TRIME', 'FDR自动', '仪器维护'].map(t => <option key={t}>{t}</option>)}
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
      <RecordTable
        rows={rows}
        cols={[
          { key: 'record_type', label: '类型' }, { key: 'record_date', label: '日期' },
          { key: 'operator', label: '操作人' },
          { key: 'jianguoyun_path', label: '坚果云路径', render: v => v ? <span className="text-blue-600 text-xs truncate max-w-[160px] block">{String(v)}</span> : '—' },
        ]}
        canDelete={user.role === 'admin'}
        onDelete={handleDelete}
      />
    </div>
  )
}

function SapflowModule({ stand, user }: { stand: string; user: AuthUser }) {
  const [rows, setRows] = useState<AnyRecord[]>([])
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    record_type: '探针安装', record_date: today(), operator: user.name,
    probe_id: '', direction: 'N', install_height_cm: '', install_diameter_mm: '',
    tree_id: '', dbh_cm: '', tree_height_m: '', crown_width_m: '', branch_height_m: '',
    time_range: '', jianguoyun_path: '', maintenance_type: '日常', description: '', notes: '',
  })

  const loadRows = async () => {
    const { data } = await createStandScopedQuery('gaotang_sapflow', stand, user)
      .order('record_date', { ascending: false })
    setRows((data ?? []) as AnyRecord[])
  }

  useEffect(() => {
    loadRows()
  }, [stand, user.id, user.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const isInstall = form.record_type === '探针安装'
    const isData = form.record_type === '数据采集'
    const isMaint = form.record_type === '仪器维护'
    const { data, error } = await supabase.from('gaotang_sapflow').insert({
      stand_name: stand,
      record_type: form.record_type,
      record_date: form.record_date,
      operator: form.operator,
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
      notes: form.notes || null,
      created_by: user.id,
    }).select('*').single()
    setSaving(false)
    if (!error && data) {
      await loadRows()
      setShow(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteById('gaotang_sapflow', id)
    if (!error) await loadRows()
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
                {['探针安装', '数据采集', '仪器维护'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="日期"><input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))} className={inputCls} required /></Field>
            <Field label="操作人"><input value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} required /></Field>
            {form.record_type === '探针安装' && <>
              <Field label="探针编号"><input value={form.probe_id} onChange={e => setForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
              <Field label="方位">
                <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} className={selectCls}>
                  {['N', 'S', 'E', 'W'].map(d => <option key={d}>{d}</option>)}
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
      <RecordTable
        rows={rows}
        cols={[
          { key: 'record_type', label: '类型' }, { key: 'record_date', label: '日期' },
          { key: 'operator', label: '操作人' }, { key: 'probe_id', label: '探针', render: v => v ? String(v) : '—' },
          { key: 'tree_id', label: '样树', render: v => v ? String(v) : '—' },
        ]}
        canDelete={user.role === 'admin'}
        onDelete={handleDelete}
      />
    </div>
  )
}

function TreeGrowthModule({ stand, user }: { stand: string; user: AuthUser }) {
  const [treeRows, setTreeRows] = useState<TreeRow[]>([])
  const [measureDate, setMeasureDate] = useState(new Date().toISOString().slice(0, 10))
  const [operator, setOperator] = useState('')
  const [tableSaving, setTableSaving] = useState(false)

  const [sensorRows, setSensorRows] = useState<AnyRecord[]>([])
  const [showSensorForm, setShowSensorForm] = useState(false)
  const [sensorSaving, setSensorSaving] = useState(false)
  const [sensorForm, setSensorForm] = useState({
    record_type: '茎干传感器安装',
    record_date: today(),
    operator: user.name,
    tree_id: '',
    probe_id: '',
    direction: 'N',
    install_height_cm: '',
    time_range: '',
    jianguoyun_path: '',
    maintenance_type: '日常',
    description: '',
    notes: '',
  })

  const loadDendrometryRows = async () => {
    let query = supabase
      .from('gaotang_tree_growth')
      .select('*')
      .eq('stand_name', stand)
      .eq('record_type', '每木检尺')
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (user.role !== 'admin') {
      query = query.eq('created_by', user.id)
    }

    const { data } = await query
    const mapped = (data ?? []).map((row) => makeTreeRow({
      id: String(row.id),
      sample_no: String(row.tree_id ?? ''),
      dbh: row.dbh_cm == null ? '' : String(row.dbh_cm),
      tree_height: row.tree_height_m == null ? '' : String(row.tree_height_m),
      crown_height: row.branch_height_m == null ? '' : String(row.branch_height_m),
      crown_width: row.crown_width_m == null ? '' : String(row.crown_width_m),
      _dirty: false,
    }))
    setTreeRows(mapped)

    const first = data?.[0]
    if (first?.record_date) {
      setMeasureDate(String(first.record_date))
    } else {
      setMeasureDate(today())
    }
    setOperator(first?.operator ? String(first.operator) : user.name)
  }

  const loadSensorRows = async () => {
    let query = createStandScopedQuery('gaotang_tree_growth', stand, user)
      .neq('record_type', '每木检尺')
      .order('record_date', { ascending: false })

    const { data } = await query
    setSensorRows((data ?? []) as AnyRecord[])
  }

  const loadAll = async () => {
    await Promise.all([loadDendrometryRows(), loadSensorRows()])
  }

  useEffect(() => {
    loadAll()
  }, [stand, user.id, user.role])

  const updateTreeRow = (rowKey: string, patch: Partial<TreeRow>) => {
    setTreeRows((prev) => prev.map((row) => (
      row._key === rowKey ? { ...row, ...patch, _dirty: true } : row
    )))
  }

  const handleAddRow = () => {
    setTreeRows((prev) => [...prev, makeTreeRow({ _dirty: true })])
  }

  const handleDeleteTreeRow = async (row: TreeRow) => {
    if (row.id) {
      const { error } = await supabase.from('gaotang_tree_growth').delete().eq('id', row.id)
      if (error) return
    }
    setTreeRows((prev) => prev.filter((item) => item._key !== row._key))
  }

  const parseOptionalNumber = (value: string) => {
    if (!value.trim()) return null
    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? null : parsed
  }

  const handleSaveAll = async () => {
    if (!operator.trim()) return
    setTableSaving(true)

    for (const row of treeRows) {
      const payload = {
        stand_name: stand,
        record_type: '每木检尺',
        record_date: measureDate,
        operator,
        tree_id: row.sample_no || null,
        dbh_cm: parseOptionalNumber(row.dbh),
        tree_height_m: parseOptionalNumber(row.tree_height),
        branch_height_m: parseOptionalNumber(row.crown_height),
        crown_width_m: parseOptionalNumber(row.crown_width),
        created_by: user.id,
      }

      if (row.id) {
        const { error } = await supabase.from('gaotang_tree_growth').update(payload).eq('id', row.id)
        if (error) {
          setTableSaving(false)
          return
        }
      } else {
        const { error } = await supabase.from('gaotang_tree_growth').insert(payload)
        if (error) {
          setTableSaving(false)
          return
        }
      }
    }

    setTableSaving(false)
    await loadDendrometryRows()
  }

  const handleSensorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSensorSaving(true)
    const isInstall = sensorForm.record_type === '茎干传感器安装'
    const isData = sensorForm.record_type === '茎干传感器数采'
    const isMaint = sensorForm.record_type === '茎干传感器维护'

    const { data, error } = await supabase.from('gaotang_tree_growth').insert({
      stand_name: stand,
      record_type: sensorForm.record_type,
      record_date: sensorForm.record_date,
      operator: sensorForm.operator,
      tree_id: isInstall ? sensorForm.tree_id || null : null,
      probe_id: (isInstall || isMaint) ? sensorForm.probe_id || null : null,
      direction: isInstall ? sensorForm.direction : null,
      install_height_cm: isInstall && sensorForm.install_height_cm ? parseFloat(sensorForm.install_height_cm) : null,
      time_range: isData ? sensorForm.time_range || null : null,
      jianguoyun_path: isData ? sensorForm.jianguoyun_path || null : null,
      maintenance_type: isMaint ? sensorForm.maintenance_type : null,
      description: (isMaint || isData) ? sensorForm.description || null : null,
      notes: sensorForm.notes || null,
      created_by: user.id,
    }).select('*').single()

    setSensorSaving(false)
    if (!error && data) {
      await loadSensorRows()
      setShowSensorForm(false)
    }
  }

  const handleDeleteSensorRow = async (id: string) => {
    const { error } = await deleteById('gaotang_tree_growth', id)
    if (!error) await loadSensorRows()
  }

  const dirtyCount = useMemo(() => treeRows.filter((row) => row._dirty || !row.id).length, [treeRows])

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-800">每木检尺</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="测定日期">
            <input type="date" value={measureDate} onChange={(e) => setMeasureDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="操作人">
            <input type="text" value={operator} onChange={(e) => setOperator(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px] border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-white text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">样树编号</th>
                <th className="px-3 py-2 text-left">胸径(cm)</th>
                <th className="px-3 py-2 text-left">树高(m)</th>
                <th className="px-3 py-2 text-left">枝下高(m)</th>
                <th className="px-3 py-2 text-left">冠幅(m)</th>
                <th className="px-3 py-2 text-left">删除</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {treeRows.map((row) => (
                <tr key={row._key}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={row.sample_no}
                      onChange={(e) => updateTreeRow(row._key, { sample_no: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.dbh}
                      onChange={(e) => updateTreeRow(row._key, { dbh: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.tree_height}
                      onChange={(e) => updateTreeRow(row._key, { tree_height: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.crown_height}
                      onChange={(e) => updateTreeRow(row._key, { crown_height: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      value={row.crown_width}
                      onChange={(e) => updateTreeRow(row._key, { crown_width: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDeleteTreeRow(row)}
                      className="px-2 py-1 text-xs rounded bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
              {treeRows.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-400" colSpan={6}>暂无数据，请添加行</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleAddRow}
            className="px-3 py-1.5 text-sm rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
          >
            + 添加行
          </button>
          <button
            onClick={handleSaveAll}
            disabled={tableSaving}
            className="px-4 py-2 text-sm rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-50"
          >
            {tableSaving ? '保存中…' : `保存全部${dirtyCount > 0 ? `（${dirtyCount} 条）` : ''}`}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-gray-800">茎干微生长传感器</h4>
          <button onClick={() => setShowSensorForm(!showSensorForm)} className="flex items-center gap-1 px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800">
            {showSensorForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showSensorForm ? '取消' : '新增'}
          </button>
        </div>

        {showSensorForm && (
          <form onSubmit={handleSensorSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="记录类型">
                <select value={sensorForm.record_type} onChange={e => setSensorForm(f => ({ ...f, record_type: e.target.value }))} className={selectCls} required>
                  {['茎干传感器安装', '茎干传感器数采', '茎干传感器维护'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="日期"><input type="date" value={sensorForm.record_date} onChange={e => setSensorForm(f => ({ ...f, record_date: e.target.value }))} className={inputCls} required /></Field>
              <Field label="操作人"><input value={sensorForm.operator} onChange={e => setSensorForm(f => ({ ...f, operator: e.target.value }))} className={inputCls} required /></Field>
              {sensorForm.record_type === '茎干传感器安装' && <>
                <Field label="样树编号"><input value={sensorForm.tree_id} onChange={e => setSensorForm(f => ({ ...f, tree_id: e.target.value }))} className={inputCls} /></Field>
                <Field label="传感器编号"><input value={sensorForm.probe_id} onChange={e => setSensorForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
                <Field label="方位"><select value={sensorForm.direction} onChange={e => setSensorForm(f => ({ ...f, direction: e.target.value }))} className={selectCls}>{['N', 'S', 'E', 'W'].map(d => <option key={d}>{d}</option>)}</select></Field>
                <Field label="安装高度(cm)"><input type="number" step="0.1" value={sensorForm.install_height_cm} onChange={e => setSensorForm(f => ({ ...f, install_height_cm: e.target.value }))} className={inputCls} /></Field>
              </>}
              {sensorForm.record_type === '茎干传感器数采' && <>
                <Field label="数据时间范围"><input value={sensorForm.time_range} onChange={e => setSensorForm(f => ({ ...f, time_range: e.target.value }))} className={inputCls} /></Field>
                <Field label="坚果云路径"><input value={sensorForm.jianguoyun_path} onChange={e => setSensorForm(f => ({ ...f, jianguoyun_path: e.target.value }))} className={inputCls} /></Field>
                <Field label="描述"><input value={sensorForm.description} onChange={e => setSensorForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
              </>}
              {sensorForm.record_type === '茎干传感器维护' && <>
                <Field label="传感器编号"><input value={sensorForm.probe_id} onChange={e => setSensorForm(f => ({ ...f, probe_id: e.target.value }))} className={inputCls} /></Field>
                <Field label="维护类型"><select value={sensorForm.maintenance_type} onChange={e => setSensorForm(f => ({ ...f, maintenance_type: e.target.value }))} className={selectCls}><option>日常</option><option>故障</option></select></Field>
                <Field label="描述"><input value={sensorForm.description} onChange={e => setSensorForm(f => ({ ...f, description: e.target.value }))} className={inputCls} /></Field>
              </>}
              <Field label="备注"><input value={sensorForm.notes} onChange={e => setSensorForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} /></Field>
            </div>
            <div className="flex justify-end"><SaveBtn saving={sensorSaving} /></div>
          </form>
        )}

        <RecordTable
          rows={sensorRows}
          cols={[
            { key: 'record_type', label: '类型' },
            { key: 'record_date', label: '日期' },
            { key: 'operator', label: '操作人' },
            { key: 'tree_id', label: '样树', render: v => v ? String(v) : '—' },
            { key: 'probe_id', label: '传感器', render: v => v ? String(v) : '—' },
          ]}
          canDelete={user.role === 'admin'}
          onDelete={handleDeleteSensorRow}
        />
      </div>
    </div>
  )
}

function SimpleModule({
  stand, user, tableName, fields, cols,
}: {
  stand: string
  user: AuthUser
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

  const loadRows = async () => {
    const { data } = await createStandScopedQuery(tableName, stand, user)
      .order('created_at', { ascending: false })
    setRows((data ?? []) as AnyRecord[])
  }

  useEffect(() => {
    loadRows()
  }, [stand, tableName, user.id, user.role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, unknown> = { stand_name: stand, created_by: user.id }
    fields.forEach(field => {
      const v = form[field.key]
      payload[field.key] = v || null
    })
    const { data, error } = await supabase.from(tableName).insert(payload).select('*').single()
    setSaving(false)
    if (!error && data) {
      await loadRows()
      setShow(false)
      setForm(initForm())
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteById(tableName, id)
    if (!error) await loadRows()
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
      <RecordTable rows={rows} cols={cols} canDelete={user.role === 'admin'} onDelete={handleDelete} />
    </div>
  )
}

function RecordTable({ rows, cols, canDelete = false, onDelete }: {
  rows: AnyRecord[]
  cols: { key: string; label: string; render?: (v: unknown) => React.ReactNode }[]
  canDelete?: boolean
  onDelete?: (id: string) => Promise<void> | void
}) {
  if (rows.length === 0) {
    return <p className="text-center py-8 text-sm text-gray-400">暂无记录</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs">
          <tr>
            {cols.map(c => <th key={c.key} className="px-3 py-2 text-left whitespace-nowrap">{c.label}</th>)}
            {canDelete && <th className="px-3 py-2 text-left whitespace-nowrap">操作</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50">
              {cols.map(c => (
                <td key={c.key} className="px-3 py-2 text-gray-700">
                  {c.render ? c.render(row[c.key]) : (row[c.key] != null ? String(row[c.key]) : '—')}
                </td>
              ))}
              {canDelete && (
                <td className="px-3 py-2">
                  <button
                    onClick={() => onDelete?.(String(row.id))}
                    className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100"
                  >
                    删除
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ModuleContent({ moduleIndex, stand, user }: {
  moduleIndex: number
  stand: string
  user: AuthUser
}) {
  switch (moduleIndex) {
    case 0:
      return <ForestMgmtModule stand={stand} user={user} />
    case 1:
      return <SoilMoistureModule stand={stand} user={user} />
    case 2:
      return <SapflowModule stand={stand} user={user} />
    case 3:
      return <TreeGrowthModule stand={stand} user={user} />
    case 4:
      return (
        <SimpleModule stand={stand} user={user} tableName="gaotang_meteo"
          fields={[
            { key: 'record_type', label: '记录类型', options: ['气象站采集', '气象站维护', '手动地下水位'] },
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
    case 5:
      return (
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
    case 6:
      return (
        <SimpleModule stand={stand} user={user} tableName="gaotang_roots"
          fields={[
            { key: 'measure_type', label: '测定类型', options: ['微根管', '土钻挖根'] },
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
    case 7:
      return (
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
    case 8:
      return (
        <SimpleModule stand={stand} user={user} tableName="gaotang_hydraulics"
          fields={[
            { key: 'measure_date', label: '测定日期', type: 'date' },
            { key: 'operator', label: '操作人' },
            { key: 'organ_type', label: '器官类型', options: ['根系', '枝条', '叶片'] },
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
    default:
      return null
  }
}

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
  const currentUser: AuthUser = { id: user.id, name: user.name, role: user.role }
  const stand = STANDS[activeStand]

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">选择林分</p>
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
        <div className="hidden sm:flex flex-wrap gap-2">
          {STANDS.map((s, i) => (
            <button key={i} onClick={() => { setActiveStand(i); setActiveModule(0) }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${i === activeStand ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700'}`}>
              {i + 1}. {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
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
