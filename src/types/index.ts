export type Role = 'admin' | 'student'

export type DegreeType = '硕士' | '博士' | '博士后'

export type StudentStatus = '在读' | '已毕业'

export interface Student {
  id: string
  created_at: string
  updated_at: string
  name: string
  student_id: string
  enrollment_year: number
  degree_type: DegreeType
  research_direction: string
  expected_graduation: string // YYYY-MM format
  status: StudentStatus
  email: string
  phone?: string
  notes?: string
  supervisor_id: string
}

export interface Profile {
  id: string
  email: string
  role: Role
  full_name: string
  created_at: string
}

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
