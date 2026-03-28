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
  species_cn?: string
  species_en?: string
  established_year: number
  region?: string
  description?: string
  created_at?: string
}

export interface SiteRow {
  id: string
  name_cn: string
  name_en: string | null
  latitude: number | null
  longitude: number | null
  elevation: number | null
  species_cn: string | null
  species_en: string | null
  established_year: number | null
  region: string | null
  created_at: string | null
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
  recorded_by?: string
  created_at?: string
}

export interface WeatherRecordRow {
  id: string
  site_id: string | null
  date: string
  temperature: number | null
  temperature_min: number | null
  temperature_max: number | null
  rainfall: number | null
  humidity: number | null
  wind_speed: number | null
  weather_desc: string | null
  source: WeatherSource | null
  recorded_by: string | null
  created_at: string | null
}

export type FieldDataType = 'soil_moisture' | 'sap_flow' | 'growth' | 'irrigation' | 'phenology' | 'other'

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

export interface FieldObservationRow {
  id: string
  site_id: string | null
  student_name: string | null
  date: string
  data_type: FieldDataType | null
  value: number | null
  unit: string | null
  dbh: number | null
  tree_height: number | null
  irrigation_amount: number | null
  phenology_stage: string | null
  notes: string | null
  created_at: string | null
}

export interface FileRecord {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
  file_name?: string
  file_path?: string
  file_type?: string
  file_size?: number
  site_id?: string
  student_name?: string
  upload_date?: string
  notes?: string
  created_at?: string
}

export interface FileRow {
  id: string
  file_name: string
  file_path: string | null
  file_type: string | null
  file_size: number | null
  site_id: string | null
  student_name: string | null
  upload_date: string | null
  notes: string | null
  created_at: string | null
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

export interface StageHistoryEntry {
  stage: ProjectStage
  entered_at: string
  left_at?: string
  note?: string
}

export interface Project {
  id: string
  title: string
  description?: string
  student_id: string
  student_name: string
  stage: ProjectStage
  start_date: string
  expected_end_date?: string
  stage_entered_at?: string
  stage_history?: StageHistoryEntry[]
  advisor_notes?: string
  site_id?: string
  created_at?: string
  updated_at?: string
}

export interface ProjectRow {
  id: string
  title: string
  description: string | null
  student_id: string | null
  student_name: string | null
  stage: ProjectStage | null
  start_date: string | null
  expected_end_date: string | null
  stage_entered_at: string | null
  stage_history: StageHistoryEntry[] | null
  advisor_notes: string | null
  site_id: string | null
  created_at: string | null
  updated_at: string | null
}

// ===== 学生提问答疑 =====

export type QuestionStatus = '待回复' | '已回复' | '已关闭'

export interface Question {
  id: string
  student_id: string
  student_name: string
  title: string
  content: string
  status: QuestionStatus
  project_id?: string
  project_title?: string
  created_at?: string
  updated_at?: string
}

export interface QuestionRow {
  id: string
  student_id: string | null
  student_name: string | null
  title: string | null
  content: string | null
  status: QuestionStatus | null
  project_id: string | null
  created_at: string | null
  updated_at: string | null
}

export interface QuestionReply {
  id: string
  question_id: string
  author_name: string
  author_role: Role
  content: string
  created_at?: string
}

export interface QuestionReplyRow {
  id: string
  question_id: string | null
  author_name: string | null
  author_role: string | null
  content: string | null
  created_at: string | null
}

export type PaperStatus = '在写' | '投稿中' | '审稿中' | '修改中' | '已接收' | '已发表'
export type PaperPartition = '1区' | '2区' | '3区' | '4区' | '2区TOP' | 'EI' | 'CSCD' | '卓越期刊'

export interface PaperTimeline {
  date: string
  event: string
}

export interface PaperTimelineRow {
  id: string
  paper_id: string
  date: string
  event: string
  created_at: string | null
}

export interface Paper {
  id: string
  title: string
  authors: string
  journal: string
  status: PaperStatus
  student_id?: string
  student_name?: string
  submission_date?: string
  submit_date?: string
  accept_date?: string
  publish_date?: string
  publish_year?: number
  journal_partition?: string
  corresponding_author?: string
  doi?: string
  impact_factor?: number
  timeline: PaperTimeline[]
  created_at?: string
  updated_at?: string
}

export interface PaperRow {
  id: string
  title: string
  authors: string | null
  journal: string | null
  status: PaperStatus | null
  journal_partition: string | null
  corresponding_author: string | null
  submit_date: string | null
  publish_date: string | null
  doi: string | null
  impact_factor: number | null
  created_at: string | null
  updated_at: string | null
}

// ===== Phase 4: 周报+毕业节点 =====

export interface Report {
  id: string
  student_id: string
  student_name: string
  week_start: string
  week_end: string
  content: string
  next_week_plan?: string
  attachments?: FileRecord[]
  advisor_comment?: string
  created_at?: string
  updated_at?: string
}

export interface ReportRow {
  id: string
  student_id: string | null
  student_name: string | null
  week_start: string | null
  week_end: string | null
  content: string | null
  next_week_plan: string | null
  advisor_comment: string | null
  created_at: string | null
  updated_at?: string | null
}

export type MilestoneType = '开题' | '中期' | '预答辩' | '答辩' | '论文提交'

export type MilestoneStatus = '未开始' | '进行中' | '已完成' | '已逾期'
export type MilestoneDbStatus = Exclude<MilestoneStatus, '已逾期'>

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

export interface MilestoneRow {
  id: string
  student_id: string | null
  student_name: string | null
  type: MilestoneType | null
  planned_date: string | null
  actual_date: string | null
  status: MilestoneDbStatus | null
  created_at: string | null
}

// ===== Phase 5: 仪器/站点预约 =====

export type InstrumentType = '光合仪' | '水势仪' | '液流探针' | '土壤水分仪' | '气象站' | '无人机' | '树木生长仪' | '其他'
export type InstrumentStatus = '可用' | '使用中' | '维修中' | '报废'

export interface Instrument {
  id: string
  name: string
  type: InstrumentType
  model?: string
  status: InstrumentStatus
  location?: string
  created_at?: string
}

export interface InstrumentRow {
  id: string
  name: string
  type: string | null
  model: string | null
  status: InstrumentStatus | null
  location: string | null
  created_at: string | null
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

export interface ReservationRow {
  id: string
  instrument_id: string | null
  instrument_name: string | null
  student_id: string | null
  student_name: string | null
  start_date: string | null
  end_date: string | null
  purpose: string | null
  status: Reservation['status'] | null
  created_at: string | null
}
