import { createClient } from '@supabase/supabase-js'
import type { Student, Profile } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const getSession = () => supabase.auth.getSession()

// Profile helpers
export const getProfile = (userId: string) =>
  supabase.from('profiles').select('*').eq('id', userId).single()

// Student CRUD
export const getStudents = () =>
  supabase.from('students').select('*').order('enrollment_year', { ascending: false })

export const getStudent = (id: string) =>
  supabase.from('students').select('*').eq('id', id).single()

export const createStudent = (data: Omit<Student, 'id' | 'created_at' | 'updated_at'>) =>
  supabase.from('students').insert(data).select().single()

export const updateStudent = (id: string, data: Partial<Student>) =>
  supabase.from('students').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single()

export const deleteStudent = (id: string) =>
  supabase.from('students').delete().eq('id', id)

// Profile type export for use in components
export type { Profile }
