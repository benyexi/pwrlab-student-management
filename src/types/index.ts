export type Role = 'admin' | 'student'

export type DegreeType = '硕士' | '博士' | '博后'

export type StudentStatus = '在读' | '已毕业' | '已离组'

export interface Student {
  id: string
  name: string
  student_id: string
  enrollment_year: number
  degree_type: DegreeType
  research_direction: string
  expected_graduation: string
  status: StudentStatus
  advisor: string
  co_advisor: string
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  role: Role
  name: string
  avatar_url?: string
}

export interface DashboardStats {
  total: number
  active: number
  graduated: number
  left: number
}

// ===== Phase 2: 野外数据采集 =====

export interface Site {
  id: string
  name_cn: string
  name_en: string
  latitude: number
  longitude: number
  elevation: number
  tree_species: string
  established_year: number
  description?: string
}

export type WeatherSource = 'auto' | 'manual'

export interface WeatherRecord {
  id: string
  site_id: string
  date: string
  temperature: number
  temperature_min?: number
  temperature_max?: number
  rainfall: number
  humidity: number
  wind_speed: number
  weather_desc: string
  source: WeatherSource
  created_at?: string
}

export type FieldDataType = 'soil_moisture' | 'sap_flow' | 'growth' | 'irrigation' | 'phenology'

export interface FieldObservation {
  id: string
  site_id: string
  student_id?: string
  student_name?: string
  date: string
  data_type: FieldDataType
  value?: number
  unit?: string
  dbh?: number
  tree_height?: number
  irrigation_amount?: number
  phenology_stage?: string
  notes?: string
  photos?: FileRecord[]
  created_at?: string
}

export interface FileRecord {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
}

// ===== Phase 3: 研究进展+论文管理 =====

export type ProjectStage =
  | '选题'
  | '文献综述'
  | '实验设计'
  | '数据采集'
  | '数据分析'
  | '论文写作'
  | '投稿'
  | '审稿修改'
  | '接收/发表'

export interface Project {
  id: string
  title: string
  description?: string
  student_id: string
  student_name: string
  stage: ProjectStage
  start_date: string
  expected_end_date?: string
  created_at?: string
  updated_at?: string
}

export type PaperStatus = '在写' | '投稿中' | '审稿中' | '修改中' | '已接收' | '已发表'

export interface PaperTimeline {
  date: string
  event: string
}

export interface Paper {
  id: string
  title: string
  authors: string
  journal: string
  status: PaperStatus
  student_id?: string
  student_name?: string
  submit_date?: string
  accept_date?: string
  publish_date?: string
  doi?: string
  impact_factor?: number
  timeline: PaperTimeline[]
  created_at?: string
  updated_at?: string
}

// ===== Phase 4: 周报+毕业节点 =====

export interface Report {
  id: string
  student_id: string
  student_name: string
  week_start: string
  week_end: string
  content: string
  attachments?: FileRecord[]
  advisor_comment?: string
  created_at?: string
}

export type MilestoneType = '开题' | '中期' | '预答辩' | '答辩' | '论文提交'

export type MilestoneStatus = '未开始' | '进行中' | '已完成' | '已逾期'

export interface Milestone {
  id: string
  student_id: string
  student_name: string
  type: MilestoneType
  planned_date: string
  actual_date?: string
  status: MilestoneStatus
  notes?: string
  created_at?: string
}

// ===== Phase 5: 仪器/站点预约 =====

export type InstrumentType = '光合仪' | '水势仪' | '液流探针' | '土壤水分仪' | '气象站' | '无人机' | '树木生长仪' | '其他'

export interface Instrument {
  id: string
  name: string
  type: InstrumentType
  model?: string
  status: '可用' | '使用中' | '维修中'
  location?: string
}

export interface Reservation {
  id: string
  instrument_id: string
  instrument_name: string
  student_id: string
  student_name: string
  start_date: string
  end_date: string
  purpose: string
  status: '待审批' | '已批准' | '已拒绝' | '已完成' | '已取消'
  created_at?: string
}
