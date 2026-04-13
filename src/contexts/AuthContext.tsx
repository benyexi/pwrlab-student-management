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

    // Hard-timeout safety net: if getSession() + fetchProfile() both hang
    // (e.g. network stall during token refresh), unblock the UI after 10s.
    const hardTimeout = setTimeout(() => {
      if (mounted) {
        setUser(null)
        setLoading(false)
      }
    }, 10000)

    async function init() {
      try {
        // getSession() can trigger a network token-refresh that hangs forever.
        // Race it against an 8s timeout that resolves as "no session".
        const { data: { session } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null } }>(resolve =>
            setTimeout(() => resolve({ data: { session: null } }), 8000)
          ),
        ])
        if (!mounted) return
        if (session?.user) {
          await fetchProfile(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch {
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      } finally {
        clearTimeout(hardTimeout)
      }
    }

    init()

    // Subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return   // already handled by init()
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
      clearTimeout(hardTimeout)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(su: SupabaseUser) {
    try {
      // Race the profiles query against a 5s timeout so a hung DB call
      // never leaves `loading` stuck at true.
      const result = await Promise.race([
        supabase.from('profiles').select('*').eq('id', su.id).single(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('profile fetch timeout')), 5000)
        ),
      ])
      const { data } = result as { data: { email?: string; role?: string; name?: string } | null }
      setUser({
        id: su.id,
        email: data?.email || su.email || '',
        role: (data?.role || 'student') as Role,
        name: data?.name || su.email?.split('@')[0] || 'User',
      })
    } catch {
      // Any error (network, timeout, RLS denial) → fall back to minimal user
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
