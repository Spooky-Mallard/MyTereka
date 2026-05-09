'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Eye, EyeOff, Fingerprint } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

export default function LoginPage() {
  const router = useRouter()
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    const result = await signIn('credentials', {
      email:    form.get('email'),
      password: form.get('password'),
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      toast.error('Incorrect email or password')
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--background)' }}
    >
      <Toaster position="top-center" richColors />

      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full"
        style={{ background: 'rgba(0,184,148,0.08)', filter: 'blur(60px)' }} />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full"
        style={{ background: 'rgba(245,158,11,0.06)', filter: 'blur(50px)' }} />

      <div
        className="relative w-full max-w-sm rounded-3xl p-8"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 8px 24px rgba(0,184,148,0.35)' }}
          >
            <img src="/logo.svg" alt="MyTereka" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-center text-2xl font-bold"
              style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
              Welcome back
            </h1>
            <p className="mt-1 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Sign in to your MyTereka account
            </p>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="mytereka-input"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="mytereka-input pr-12"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/auth/forgot-password" className="text-sm font-medium transition hover:opacity-70"
              style={{ color: 'var(--primary)' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(0,184,148,0.35)', fontFamily: 'Poppins, sans-serif' }}
          >
            {loading ? 'Signing in…' : 'Log In'}
          </button>
        </form>

        <button
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border text-sm font-semibold transition hover:opacity-80"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--surface-alt)' }}
        >
          <Fingerprint size={18} style={{ color: 'var(--primary)' }} />
          Sign in with Fingerprint
        </button>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          No account?{' '}
          <Link href="/auth/register" className="font-semibold" style={{ color: 'var(--primary)' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
