export type Role = 'admin' | 'student'

export type DegreeType = '硕士' | '博士' | '博士后'

export type StudentStatus = '在读' | '已毕业' | '已离组'

export interface Student {
  id: string
  created_at?: string
  updated_at?: string
  name: string
  student_id: string
  enrollment_year: number
  degree_type: DegreeType
  research_direction: string
  expected_graduation: string // YYYY-MM format
  status: StudentStatus
  email?: string
  phone?: string
  notes?: string
  supervisor_id?: string
  advisor?: string
  co_advisor?: string
}

export interface Profile {
  id: string
  email?: string
  role: Role
  full_name?: string
  name?: string
  created_at?: string
}

// Used by AuthContext
export interface User {
  id: string
  email: string
  role: Role
  name: string
}

// Legacy alias
export interface AuthUser {
  id: string
  email: string
  role: Role
  full_name: string
}

export interface DashboardStats {
  total: number
  active: number
  graduated: number
  masters: number
  phd: number
  postdoc: number
  byYear: Record<number, number>
}

// ===== Sites =====
export interface Site {
  id: string
  name_cn: string
  name_en: string
  latitude: number
  longitude: number
  elevation: number
  tree_species?: string
  species_cn?: string
  species_en?: string
  established_year: number
  region?: string
  created_at?: string
}

// ===== Weather =====
export type WeatherSource = 'auto' | 'manual'

export interface WeatherRecord {
  id: string
  site_id: string
  date: string
  temperature?: number
  temperature_min?: number
  temperature_max?: number
  rainfall?: number
  humidity?: number
  wind_speed?: number
  weather_desc?: string
  source: WeatherSource
  recorded_by?: string
  created_at?: string
}

// ===== Field Observations =====
export type FieldDataType = 'soil_moisture' | 'sap_flow' | 'growth' | 'irrigation' | 'phenology' | 'other'

export interface FieldObservation {
  id: string
  site_id: string
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
  created_at?: string
}

// ===== Projects =====
export type ProjectStage =
  | '选题' | '文献综述' | '实验设计' | '数据采集'
  | '数据分析' | '论文写作' | '投稿' | '审稿修改' | '接收/发表'

export interface StageHistoryEntry {
  stage: ProjectStage
  date?: string
  entered_at?: string
  left_at?: string
  note?: string
}

export interface Project {
  id: string
  title: string
  description?: string
  student_id?: string
  student_name?: string
  stage: ProjectStage
  stage_entered_at?: string
  stage_history?: StageHistoryEntry[]
  start_date?: string
  expected_end_date?: string
  site_id?: string | null
  advisor_notes?: string
  created_at?: string
  updated_at?: string
}

// ===== Papers =====
export type PaperStatus = '在写' | '投稿中' | '审稿中' | '修改中' | '已接收' | '已发表'

export type PaperPartition = '1区' | '2区' | '3区' | '4区' | '2区TOP' | 'EI' | 'CSCD' | '卓越期刊'

export type PaperType = '毕业论文' | '期刊论文' | '会议论文'

export interface Paper {
  paper_type?: PaperType
  id: string
  title: string
  authors: string
  journal: string
  status: PaperStatus
  partition?: PaperPartition[]
  journal_partition?: string
  doi?: string
  student_name?: string
  student_id?: string
  submitted_date?: string
  submission_date?: string
  submit_date?: string
  accepted_date?: string
  accept_date?: string
  published_date?: string
  publish_year?: string | number
  publish_date?: string
  notes?: string
  is_corresponding?: boolean
  corresponding_author?: string
  impact_factor?: number | string
  timeline: { date: string; event: string }[]
  created_at?: string
  updated_at?: string
}

// ===== Reports =====
export interface Report {
  id: string
  student_id: string
  student_name: string
  week_start: string
  week_end: string
  content: string
  next_week_plan?: string
  advisor_comment?: string
  created_at?: string
  updated_at?: string
}

// Raw DB row (may have partial fields)
export type ReportRow = Partial<Report> & { id: string }

// ===== Milestones =====
export type MilestoneStatus = '已完成' | '进行中' | '未开始' | '已逾期'

export type MilestoneType = '开题' | '中期' | '预答辩' | '答辩' | '论文提交'

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

// ===== Reservations =====
export interface Instrument {
  id: string
  name: string
  category?: string
  type?: string
  model?: string
  status: '可用' | '使用中' | '维修中'
  location?: string
  notes?: string
  created_at?: string
}

export interface Reservation {
  id: string
  instrument_id: string
  instrument_name: string
  student_id?: string
  student_name: string
  start_date: string
  end_date: string
  purpose: string
  status: '待审批' | '已批准' | '已拒绝' | '已完成' | '已取消'
  notes?: string
  created_at?: string
}

// ===== Questions =====
export type QuestionStatus = '待回复' | '已回复' | '已关闭'

export interface Question {
  id: string
  student_id: string
  student_name: string
  title: string
  content: string
  status: QuestionStatus
  project_id?: string
  created_at?: string
  updated_at?: string
}

export interface QuestionReply {
  id: string
  question_id: string
  author_id: string
  author_name: string
  author_role: Role
  content: string
  created_at?: string
}
