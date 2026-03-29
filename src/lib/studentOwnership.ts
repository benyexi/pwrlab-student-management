import type { Student, User } from '../types'

const STRONG_MATCH_SCORE = 60
const WEAK_MATCH_SCORE = 10

function normalize(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

function emailLocalPart(email?: string | null) {
  const normalized = normalize(email)
  if (!normalized) return ''
  const [local] = normalized.split('@')
  return local || ''
}

function scoreStudentOwnership(student: Student, user: User) {
  const studentId = normalize(student.id)
  const studentEmail = normalize(student.email)
  const studentCode = normalize(student.student_id)
  const studentName = normalize(student.name)

  const userId = normalize(user.id)
  const userEmail = normalize(user.email)
  const userEmailLocal = emailLocalPart(user.email)
  const userName = normalize(user.name)

  let score = 0

  if (studentId && userId && studentId === userId) score += 100
  if (studentEmail && userEmail && studentEmail === userEmail) score += 90

  if (studentCode) {
    if (studentCode === userId) score += 80
    if (studentCode === userEmail || studentCode === userEmailLocal) score += 70
  }

  if (studentName && userName && studentName === userName) score += WEAK_MATCH_SCORE

  return score
}

export function resolveOwnedStudents(students: Student[], user: User | null) {
  if (!user || user.role !== 'student') return students

  const scored = students
    .map((student) => ({ student, score: scoreStudentOwnership(student, user) }))
    .filter((item) => item.score > 0)

  const strongMatches = scored
    .filter((item) => item.score >= STRONG_MATCH_SCORE)
    .map((item) => item.student)

  if (strongMatches.length > 0) return strongMatches

  const weakMatches = scored
    .filter((item) => item.score >= WEAK_MATCH_SCORE)
    .map((item) => item.student)

  if (weakMatches.length === 1) return weakMatches

  return []
}

export function canAccessStudent(target: Student, students: Student[], user: User | null) {
  if (!user || user.role !== 'student') return true
  const ownedStudents = resolveOwnedStudents(students, user)
  return ownedStudents.some((student) => student.id === target.id)
}

