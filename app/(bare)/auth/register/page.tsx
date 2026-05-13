'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { registerUser } from '@/lib/actions/auth'
import { Toaster } from '@/components/ui/sonner'

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}

export default function RegisterPage() {
  const router  = useRouter()
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    const form = new FormData(e.currentTarget)
    const result = await registerUser(form)

    if (result?.error) {
      setLoading(false)
      const msg = result.error
      if (msg.includes('Mobile'))           setFieldErrors({ mobile: msg })
      else if (msg.includes('Password'))    setFieldErrors({ password: msg })
      else if (msg.includes('email'))       setFieldErrors({ email: msg })
      else if (msg.includes('Username') || msg.includes('username'))
                                            setFieldErrors({ username: msg })
      else toast.error(msg)
      return
    }

    // Auto-login after successful registration
    const signInResult = await signIn('credentials', {
      email:    form.get('email'),
      password: form.get('password'),
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      toast.error('Account created — please log in')
      router.push('/auth/login')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-start overflow-y-auto px-6 py-10"
      style={{ background: 'var(--background)' }}
    >
      <Toaster position="top-center" richColors />

      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="mb-6 flex flex-col items-center gap-2">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 6px 20px rgba(0,184,148,0.35)' }}
          >
            <img src="/logo.svg" alt="MyTereka" className="h-9 w-9 object-contain" />
          </div>
          <h1 className="text-xl font-bold"
            style={{ color: 'var(--foreground)', fontFamily: 'Poppins, sans-serif' }}>
            Create your account
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--muted-foreground)' }}>
            Join thousands of Ugandan youth managing money smarter
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Full name">
            <input name="name" type="text" placeholder="Atong Precious Olanya"
              required autoComplete="name"
              className="mytereka-input" />
          </Field>

          <Field label="Username" error={fieldErrors.username}>
            <input name="username" type="text" placeholder="atong_p"
              required autoComplete="username"
              pattern="[a-z0-9_]{3,20}"
              className={`mytereka-input${fieldErrors.username ? ' error' : ''}`} />
            {!fieldErrors.username && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                3-20 chars, lowercase letters, numbers, underscore. Friends find you by this.
              </p>
            )}
          </Field>

          <Field label="Email" error={fieldErrors.email}>
            <input name="email" type="email" placeholder="you@example.com"
              required autoComplete="email"
              className={`mytereka-input${fieldErrors.email ? ' error' : ''}`} />
          </Field>

          <Field label="Mobile number" error={fieldErrors.mobile}>
            <input name="mobile" type="tel" placeholder="256701234567"
              className={`mytereka-input${fieldErrors.mobile ? ' error' : ''}`} />
            {!fieldErrors.mobile && (
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                MTN or Airtel format: 256XXXXXXXXX
              </p>
            )}
          </Field>

          <Field label="Date of birth">
            <input name="dob" type="date" required className="mytereka-input" />
          </Field>

          <Field label="Password" error={fieldErrors.password}>
            <div className="relative">
              <input
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Min 8 characters"
                required
                autoComplete="new-password"
                className={`mytereka-input pr-12${fieldErrors.password ? ' error' : ''}`}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--muted-foreground)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-base font-bold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            style={{ background: 'var(--gradient-primary)', boxShadow: '0 4px 16px rgba(0,184,148,0.35)', fontFamily: 'Poppins, sans-serif' }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--primary)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
