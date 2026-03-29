import type {
  WeatherRecord, FieldObservation, Project, Paper, Report, Milestone, Reservation, Instrument,
} from '../types'

// Helper to generate dates relative to today
const d = (daysAgo: number) => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().slice(0, 10)
}

// ===== Weather Records for Yangling site =====
export const DEMO_WEATHER: WeatherRecord[] = Array.from({ length: 10 }, (_, i) => ({
  id: `w${i + 1}`,
  site_id: 's07',
  date: d(i),
  temperature: +(18 + Math.random() * 10 - 5).toFixed(1),
  temperature_min: +(10 + Math.random() * 5).toFixed(1),
  temperature_max: +(22 + Math.random() * 8).toFixed(1),
  rainfall: +(Math.random() > 0.6 ? Math.random() * 15 : 0).toFixed(1),
  humidity: +(45 + Math.random() * 30).toFixed(0) as unknown as number,
  wind_speed: +(1 + Math.random() * 4).toFixed(1),
  weather_desc: ['晴', '多云', '阴', '小雨', '晴转多云'][Math.floor(Math.random() * 5)],
  source: i < 7 ? 'auto' : 'manual',
}))

// ===== Field Observations =====
export const DEMO_FIELD_OBS: FieldObservation[] = [
  { id: 'fo1', site_id: 's07', student_name: '张三', date: d(1), data_type: 'soil_moisture', value: 23.5, unit: '%', notes: '0-30cm土层' },
  { id: 'fo2', site_id: 's07', student_name: '李四', date: d(1), data_type: 'sap_flow', value: 42.3, unit: 'g/h', notes: 'TDP探针#3' },
  { id: 'fo3', site_id: 's02', student_name: '张三', date: d(2), data_type: 'growth', dbh: 15.2, tree_height: 12.8, unit: 'cm/m', notes: '样树编号T12' },
  { id: 'fo4', site_id: 's07', student_name: '王五', date: d(3), data_type: 'irrigation', irrigation_amount: 50, unit: 'mm', notes: '滴灌处理' },
  { id: 'fo5', site_id: 's04', student_name: '赵六', date: d(3), data_type: 'phenology', phenology_stage: '展叶期', notes: '柠条新叶展开50%' },
  { id: 'fo6', site_id: 's07', student_name: '张三', date: d(5), data_type: 'soil_moisture', value: 18.7, unit: '%', notes: '0-30cm土层，灌溉前' },
  { id: 'fo7', site_id: 's10', student_name: '李四', date: d(6), data_type: 'sap_flow', value: 38.1, unit: 'g/h', notes: '油松样树#5' },
  { id: 'fo8', site_id: 's05', student_name: '赵六', date: d(7), data_type: 'growth', dbh: 22.4, tree_height: 16.5, unit: 'cm/m', notes: '云杉固定样地' },
]

// ===== Projects =====
export const DEMO_PROJECTS: Project[] = [
  { id: 'p1', title: '黄土高原刺槐人工林蒸腾耗水规律研究', description: '基于树干液流法研究不同密度刺槐林蒸腾特征', student_id: 'stu1', student_name: '张三', stage: '数据分析', start_date: '2023-09-01', expected_end_date: '2026-06-30' },
  { id: 'p2', title: '杨树人工林土壤水分动态与根系吸水模式', description: '利用稳定同位素示踪杨树不同季节水分来源', student_id: 'stu2', student_name: '李四', stage: '数据采集', start_date: '2024-03-01', expected_end_date: '2027-06-30' },
  { id: 'p3', title: '气候变化下华北平原杨树人工林生产力预测', description: '基于GOTILWA+模型模拟不同气候情景', student_id: 'stu3', student_name: '王五', stage: '论文写作', start_date: '2022-09-01', expected_end_date: '2025-12-31' },
  { id: 'p4', title: '干旱区梭梭人工林水文效应研究', description: '磴口站梭梭人工林对地下水补给的影响', student_id: 'stu4', student_name: '赵六', stage: '文献综述', start_date: '2025-09-01', expected_end_date: '2028-06-30' },
  { id: 'p5', title: '天山云杉林冠层蒸散特征及其环境响应', description: '伊犁站涡度相关法观测', student_id: 'stu5', student_name: '钱七', stage: '实验设计', start_date: '2025-03-01', expected_end_date: '2028-06-30' },
]

// ===== Papers =====
export const DEMO_PAPERS: Paper[] = [
  {
    id: 'pa1', title: 'Transpiration patterns of Robinia pseudoacacia plantations on the Loess Plateau under different thinning intensities',
    authors: '张三, 关锡明, et al.', journal: 'Agricultural and Forest Meteorology', status: '审稿中',
    student_name: '张三', submit_date: '2025-12-15', impact_factor: 6.2,
    timeline: [
      { date: '2025-08-01', event: '初稿完成' },
      { date: '2025-10-20', event: '导师修改完成' },
      { date: '2025-12-15', event: '投稿 Agricultural and Forest Meteorology' },
      { date: '2026-01-10', event: '编辑分配审稿人' },
    ],
  },
  {
    id: 'pa2', title: 'Seasonal water source partitioning by Populus plantations in the North China Plain: a dual-isotope approach',
    authors: '李四, 关锡明, et al.', journal: 'Journal of Hydrology', status: '在写',
    student_name: '李四', impact_factor: 6.4,
    timeline: [
      { date: '2026-01-15', event: '开始写作' },
      { date: '2026-03-01', event: '完成初稿Methods部分' },
    ],
  },
  {
    id: 'pa3', title: 'Modeling the productivity of Populus plantations under climate change scenarios using GOTILWA+',
    authors: '王五, 关锡明, et al.', journal: 'Forest Ecology and Management', status: '已发表',
    student_name: '王五', submit_date: '2025-06-01', accept_date: '2025-09-15', publish_date: '2025-11-01',
    doi: '10.1016/j.foreco.2025.121234', impact_factor: 3.7,
    timeline: [
      { date: '2025-03-01', event: '初稿完成' },
      { date: '2025-06-01', event: '投稿' },
      { date: '2025-07-20', event: '审稿意见返回' },
      { date: '2025-08-15', event: '修改稿提交' },
      { date: '2025-09-15', event: '接收' },
      { date: '2025-11-01', event: '在线发表' },
    ],
  },
  {
    id: 'pa4', title: '黄土高原刺槐人工林密度调控对蒸腾耗水的影响',
    authors: '张三, 关锡明', journal: '生态学报', status: '已接收',
    student_name: '张三', submit_date: '2025-09-01', accept_date: '2026-02-20', impact_factor: 1.8,
    timeline: [
      { date: '2025-09-01', event: '投稿生态学报' },
      { date: '2025-11-10', event: '审稿意见返回' },
      { date: '2025-12-01', event: '修改稿提交' },
      { date: '2026-02-20', event: '接收' },
    ],
  },
  {
    id: 'pa5', title: 'Sap flow dynamics and environmental controls in Pinus tabuliformis plantations',
    authors: '李四, 张三, 关锡明, et al.', journal: 'Tree Physiology', status: '投稿中',
    student_name: '李四', submit_date: '2026-03-10', impact_factor: 4.3,
    timeline: [
      { date: '2026-02-01', event: '初稿完成' },
      { date: '2026-03-10', event: '投稿 Tree Physiology' },
    ],
  },
]

// ===== Weekly Reports =====
export const DEMO_REPORTS: Report[] = [
  {
    id: 'r1', student_id: 'stu1', student_name: '张三', week_start: d(7), week_end: d(1),
    content: '## 本周工作\n\n1. 完成杨凌站3月份液流数据整理与质量控制\n2. 运行R脚本进行液流-环境因子相关分析\n3. 绘制不同密度处理下蒸腾日变化对比图\n\n## 存在问题\n\n密度最高处理组3号探针数据异常，怀疑探针移位\n\n## 下周计划\n\n1. 检查并修复异常探针\n2. 开始写论文Results部分',
    advisor_comment: '液流数据异常探针建议实地检查，顺便补测胸径。Results部分先把关键图做出来再写。',
  },
  {
    id: 'r2', student_id: 'stu2', student_name: '李四', week_start: d(7), week_end: d(1),
    content: '## 本周工作\n\n1. 温县站采集杨树木质部和土壤水样品各20组\n2. 同位素样品已送至实验室分析\n3. 阅读文献3篇（关于MixSIAR模型应用）\n\n## 存在问题\n\n3月降雨偏少，土壤深层含水量较低\n\n## 下周计划\n\n1. 继续野外采样\n2. 等待同位素结果\n3. 准备MixSIAR模型输入文件',
  },
  {
    id: 'r3', student_id: 'stu3', student_name: '王五', week_start: d(7), week_end: d(1),
    content: '## 本周工作\n\n1. GOTILWA+模型RCP4.5情景模拟完成\n2. 开始RCP8.5情景参数设置\n3. 论文Discussion部分初稿2000字\n\n## 下周计划\n\n1. 完成RCP8.5情景模拟\n2. 整理模型输出数据\n3. 继续写Discussion',
    advisor_comment: '模拟结果与实测数据的验证部分要加强，建议用Taylor图展示。',
  },
]

// ===== Milestones =====
export const DEMO_MILESTONES: Milestone[] = [
  { id: 'm1', student_id: 'stu1', student_name: '张三', type: '开题', planned_date: '2023-12-15', actual_date: '2023-12-15', status: '已完成' },
  { id: 'm2', student_id: 'stu1', student_name: '张三', type: '中期', planned_date: '2025-06-15', actual_date: '2025-06-20', status: '已完成' },
  { id: 'm3', student_id: 'stu1', student_name: '张三', type: '预答辩', planned_date: '2026-04-15', status: '未开始' },
  { id: 'm4', student_id: 'stu1', student_name: '张三', type: '答辩', planned_date: '2026-05-30', status: '未开始' },
  { id: 'm5', student_id: 'stu2', student_name: '李四', type: '开题', planned_date: '2024-12-10', actual_date: '2024-12-10', status: '已完成' },
  { id: 'm6', student_id: 'stu2', student_name: '李四', type: '中期', planned_date: '2026-06-15', status: '未开始' },
  { id: 'm7', student_id: 'stu3', student_name: '王五', type: '开题', planned_date: '2023-03-10', actual_date: '2023-03-10', status: '已完成' },
  { id: 'm8', student_id: 'stu3', student_name: '王五', type: '中期', planned_date: '2024-06-15', actual_date: '2024-06-15', status: '已完成' },
  { id: 'm9', student_id: 'stu3', student_name: '王五', type: '预答辩', planned_date: '2025-11-20', actual_date: '2025-11-20', status: '已完成' },
  { id: 'm10', student_id: 'stu3', student_name: '王五', type: '答辩', planned_date: '2026-05-15', status: '未开始' },
  { id: 'm11', student_id: 'stu3', student_name: '王五', type: '论文提交', planned_date: '2026-04-30', status: '未开始' },
  { id: 'm12', student_id: 'stu4', student_name: '赵六', type: '开题', planned_date: '2026-06-15', status: '未开始' },
  { id: 'm13', student_id: 'stu5', student_name: '钱七', type: '开题', planned_date: '2025-12-10', actual_date: '2025-12-10', status: '已完成' },
  { id: 'm14', student_id: 'stu5', student_name: '钱七', type: '中期', planned_date: '2027-06-15', status: '未开始' },
]

// ===== Instruments =====
export const DEMO_INSTRUMENTS: Instrument[] = [
  { id: 'i1', name: 'LI-6800 便携式光合仪', type: '光合仪', model: 'LI-COR 6800', status: '可用', location: '杨凌实验室' },
  { id: 'i2', name: 'PSY1 茎干水势仪', type: '水势仪', model: 'ICT PSY1', status: '使用中', location: '杨凌站' },
  { id: 'i3', name: 'TDP液流探针套装(30支)', type: '液流探针', model: 'Granier TDP-30', status: '可用', location: '仪器室' },
  { id: 'i4', name: 'TDR土壤水分仪', type: '土壤水分仪', model: 'Campbell CS616', status: '可用', location: '仪器室' },
  { id: 'i5', name: 'HOBO小型气象站', type: '气象站', model: 'Onset HOBO RX3000', status: '使用中', location: '温县站' },
  { id: 'i6', name: 'DJI Mavic 3M 多光谱无人机', type: '无人机', model: 'DJI Mavic 3 Multispectral', status: '可用', location: '杨凌实验室' },
  { id: 'i7', name: '树木径向生长记录仪', type: '树木生长仪', model: 'Ecomatik DC3', status: '维修中', location: '维修中心' },
  { id: 'i8', name: 'LI-6400XT 光合仪', type: '光合仪', model: 'LI-COR 6400XT', status: '可用', location: '杨凌实验室' },
]

// ===== Reservations =====
export const DEMO_RESERVATIONS: Reservation[] = [
  { id: 'res1', instrument_id: 'i1', instrument_name: 'LI-6800 便携式光合仪', student_id: 'stu1', student_name: '张三', start_date: '2026-04-01', end_date: '2026-04-05', purpose: '杨凌站刺槐光合测定', status: '已批准' },
  { id: 'res2', instrument_id: 'i6', instrument_name: 'DJI Mavic 3M 多光谱无人机', student_id: 'stu2', student_name: '李四', start_date: '2026-04-03', end_date: '2026-04-04', purpose: '温县站冠层遥感影像采集', status: '已批准' },
  { id: 'res3', instrument_id: 'i4', instrument_name: 'TDR土壤水分仪', student_id: 'stu4', student_name: '赵六', start_date: '2026-04-10', end_date: '2026-04-15', purpose: '磴口站土壤水分剖面测定', status: '待审批' },
  { id: 'res4', instrument_id: 'i3', instrument_name: 'TDP液流探针套装(30支)', student_id: 'stu5', student_name: '钱七', start_date: '2026-04-20', end_date: '2026-05-20', purpose: '伊犁站云杉液流探针安装', status: '待审批' },
  { id: 'res5', instrument_id: 'i1', instrument_name: 'LI-6800 便携式光合仪', student_id: 'stu3', student_name: '王五', start_date: '2026-03-20', end_date: '2026-03-25', purpose: '高唐站杨树光合速率验证', status: '已完成' },
]
