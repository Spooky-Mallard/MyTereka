'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AtSign, X, Check } from 'lucide-react'
import { setUsername, isUsernameAvailable } from '@/lib/actions/friends'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export function UsernameSetupBanner({ initialUsername }: { initialUsername: string | null }) {
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [available, setAvailable] = useState<boolean | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  if (initialUsername || dismissed) return null

  async function check(v: string) {
    const clean = v.trim().toLowerCase()
    setValue(clean)
    if (!USERNAME_REGEX.test(clean)) {
      setAvailable(null)
      return
    }
    const ok = await isUsernameAvailable(clean)
    setAvailable(ok)
  }

  function save() {
    start(async () => {
      try {
        await setUsername(value)
        toast.success('Username saved')
        setOpen(false)
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl p-4"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--primary)' }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: 'var(--gradient-primary)' }}>
          <AtSign size={18} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Pick a username
          </div>
          <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Friends find you by this. 3-20 chars, lowercase, numbers or underscore.
          </div>
        </div>
        <button onClick={() => setOpen(true)}
          className="rounded-full px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ background: 'var(--gradient-primary)' }}>
          Set up
        </button>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:opacity-80"
          style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
          <X size={13} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Choose your username</div>
              <button onClick={() => setOpen(false)} aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: 'var(--surface-alt)', color: 'var(--muted-foreground)' }}>
                <X size={13} />
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: 'var(--muted-foreground)' }}>@</span>
              <input
                value={value}
                onChange={(e) => check(e.target.value)}
                placeholder="your_handle"
                autoFocus
                className="mytereka-input"
                style={{ paddingLeft: 36 }}
              />
            </div>

            {value.length > 0 && (
              <p className="mt-2 text-xs"
                style={{
                  color: available === true ? 'var(--success)'
                    : available === false || !USERNAME_REGEX.test(value) ? 'var(--danger)'
                    : 'var(--muted-foreground)',
                }}>
                {!USERNAME_REGEX.test(value)
                  ? 'Must be 3-20 chars, lowercase, numbers, underscore'
                  : available === true ? '✓ Available'
                  : available === false ? 'Already taken'
                  : 'Checking…'}
              </p>
            )}

            <button onClick={save}
              disabled={pending || !available || !USERNAME_REGEX.test(value)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--gradient-primary)' }}>
              <Check size={14} /> {pending ? 'Saving…' : 'Save username'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
