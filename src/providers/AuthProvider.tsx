'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseEnabled } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuestMode: boolean // Supabase未設定時のゲストモード
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 初期化: セッション確認
  useEffect(() => {
    // Supabase未設定の場合はゲストモードで即完了
    if (!isSupabaseEnabled || !supabase) {
      setIsLoading(false)
      return
    }

    const client = supabase // ローカル変数で型を確定

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // リアルタイムリスナー: 認証状態変化を監視
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('認証機能は現在利用できません（ゲストモード）')
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('認証機能は現在利用できません（ゲストモード）')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) throw new Error('認証機能は現在利用できません（ゲストモード）')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    isGuestMode: !isSupabaseEnabled,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
