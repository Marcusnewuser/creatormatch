import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { fetchAccountProfiles } from '../lib/api'
import {
  clearStoredActiveMode,
  getDefaultHomePath,
  getPrimaryMode,
  isAdmin,
  readStoredActiveMode,
  resolveActiveMode,
  writeStoredActiveMode,
  type AppMode,
} from '../lib/account-mode'
import type { BrandProfile, CreatorProfile, Profile } from '../types/database'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  creatorProfile: CreatorProfile | null
  brandProfile: BrandProfile | null
  activeMode: AppMode | null
  hasCreatorProfile: boolean
  hasBrandProfile: boolean
  isAdmin: boolean
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<string>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshAccount: () => Promise<void>
  switchMode: (mode: AppMode) => void
  getDefaultHomePath: () => string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null)
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [activeMode, setActiveMode] = useState<AppMode | null>(null)
  const [loading, setLoading] = useState(true)

  const applyAccountState = useCallback(
    (
      nextProfile: Profile | null,
      nextCreator: CreatorProfile | null,
      nextBrand: BrandProfile | null,
    ) => {
      setProfile(nextProfile)
      setCreatorProfile(nextCreator)
      setBrandProfile(nextBrand)

      if (isAdmin(nextProfile)) {
        setActiveMode(null)
        return
      }

      const resolved = resolveActiveMode(
        readStoredActiveMode(),
        getPrimaryMode(nextProfile),
        Boolean(nextCreator),
        Boolean(nextBrand),
      )
      setActiveMode(resolved)
    },
    [],
  )

  const loadAccount = useCallback(
    async (userId: string) => {
      const account = await fetchAccountProfiles(userId)
      applyAccountState(account.profile, account.creatorProfile, account.brandProfile)
      return account
    },
    [applyAccountState],
  )

  const refreshAccount = useCallback(async () => {
    if (!user) return
    await loadAccount(user.id)
  }, [user, loadAccount])

  const switchMode = useCallback((mode: AppMode) => {
    writeStoredActiveMode(mode)
    setActiveMode(mode)
  }, [])

  const getDefaultHomePathFn = useCallback(() => {
    return getDefaultHomePath(profile, creatorProfile, brandProfile, activeMode)
  }, [profile, creatorProfile, brandProfile, activeMode])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        if (currentSession?.user) {
          loadAccount(currentSession.user.id)
            .catch(() => {
              setProfile(null)
              setCreatorProfile(null)
              setBrandProfile(null)
              setActiveMode(null)
            })
            .finally(() => setLoading(false))
        } else {
          setLoading(false)
        }
      })
      .catch(() => {
        setLoading(false)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (nextSession?.user) {
        loadAccount(nextSession.user.id).catch(() => {
          setProfile(null)
          setCreatorProfile(null)
          setBrandProfile(null)
          setActiveMode(null)
        })
      } else {
        setProfile(null)
        setCreatorProfile(null)
        setBrandProfile(null)
        setActiveMode(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [loadAccount])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Check your .env.local file.')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error('Supabase is not configured. Check your .env.local file.')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        const account = await loadAccount(data.user.id)
        const mode = resolveActiveMode(
          readStoredActiveMode(),
          getPrimaryMode(account.profile),
          Boolean(account.creatorProfile),
          Boolean(account.brandProfile),
        )
        return getDefaultHomePath(
          account.profile,
          account.creatorProfile,
          account.brandProfile,
          mode,
        )
      }
      return '/login'
    },
    [loadAccount],
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    clearStoredActiveMode()
    setSession(null)
    setUser(null)
    setProfile(null)
    setCreatorProfile(null)
    setBrandProfile(null)
    setActiveMode(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) throw new Error('Supabase is not configured. Check your .env.local file.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      creatorProfile,
      brandProfile,
      activeMode,
      hasCreatorProfile: Boolean(creatorProfile),
      hasBrandProfile: Boolean(brandProfile),
      isAdmin: isAdmin(profile),
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshAccount,
      switchMode,
      getDefaultHomePath: getDefaultHomePathFn,
    }),
    [
      user,
      session,
      profile,
      creatorProfile,
      brandProfile,
      activeMode,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshAccount,
      switchMode,
      getDefaultHomePathFn,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/** @deprecated Use refreshAccount */
export function useRefreshProfile() {
  const { refreshAccount } = useAuth()
  return refreshAccount
}
