import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Role, User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Explicit initial session check — onAuthStateChange alone can stall in some
    // Supabase v2 builds, leaving `loading` stuck at true forever.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    // Subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return   // already handled above
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(su: SupabaseUser) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', su.id).single()
      setUser({
        id: su.id,
        email: data?.email || su.email || '',
        role: (data?.role || 'student') as Role,
        name: data?.name || su.email?.split('@')[0] || 'User',
      })
    } catch {
      setUser({
        id: su.id,
        email: su.email || '',
        role: 'student' as Role,
        name: su.email?.split('@')[0] || 'User',
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      await fetchProfile(data.user)
    }
    return { error: error as Error | null }
  }

  const signOut = async () => {
    setUser(null)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // ignore network errors — local state already cleared
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
