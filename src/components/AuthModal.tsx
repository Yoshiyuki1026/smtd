'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { X } from 'lucide-react'

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = 'signin' | 'signup'

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // モーダルを閉じる時にフォームをリセット
  const handleClose = () => {
    setEmail('')
    setPassword('')
    setError('')
    setIsLoading(false)
    setMode('signin')
    onClose()
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'signin' ? 'ログイン' : 'サインアップ'}
          </h2>
          <p className="text-zinc-400 text-sm">
            {mode === 'signin'
              ? 'アカウントにログインして続行'
              : '新しいアカウントを作成'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 rounded-md bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full px-4 py-2 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '処理中...' : mode === 'signin' ? 'ログイン' : 'サインアップ'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="mt-4 text-center">
          <p className="text-zinc-400 text-sm">
            {mode === 'signin' ? 'アカウントがない？' : 'すでにアカウントがある？'}
            <button
              onClick={toggleMode}
              className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              {mode === 'signin' ? 'サインアップ' : 'ログイン'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
