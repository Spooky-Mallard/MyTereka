'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { setUsername, isUsernameAvailable } from '@/lib/actions/friends'

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export function UsernameEditModal({
  initialUsername,
  onClose,
  onSaved,
}: {
  initialUsername: string | null
  onClose: () => void
  onSaved?: (newUsername: string) => void
}) {
  const [value, setValue] = useState(initialUsername ?? '')
  const [available, setAvailable] = useState<boolean | null>(initialUsername ? true : null)
  const [pending, start] = useTransition()
  const router = useRouter()

  async function check(v: string) {
    const clean = v.trim().toLowerCase()
    setValue(clean)
    if (clean === (initialUsername ?? '')) {
      setAvailable(true)
      return
    }
    if (!USERNAME_REGEX.test(clean)) {
      setAvailable(null)
      return
    }
    const ok = await isUsernameAvailable(clean)
    setAvailable(ok)
  }

  function save() {
    if (value === (initialUsername ?? '')) {
      onClose()
      return
    }
    start(async () => {
      try {
        await setUsername(value)
        toast.success('Username saved')
        onSaved?.(value)
        onClose()
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed')
      }
    })
  }

  const unchanged = value === (initialUsername ?? '')
  const valid = USERNAME_REGEX.test(value)
  const canSave = valid && (unchanged || available === true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--card)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base font-bold" style={{ color: 'var(--foreground)' }}>
            {initialUsername ? 'Edit username' : 'Choose your username'}
          </div>
          <button onClick={onClose} aria-label="Close"
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
              color: unchanged ? 'var(--muted-foreground)'
                : available === true ? 'var(--success)'
                : available === false || !valid ? 'var(--danger)'
                : 'var(--muted-foreground)',
            }}>
            {unchanged ? 'Current username'
              : !valid ? 'Must be 3-20 chars, lowercase, numbers, underscore'
              : available === true ? '✓ Available'
              : available === false ? 'Already taken'
              : 'Checking…'}
          </p>
        )}

        <button onClick={save} disabled={pending || !canSave}
          className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}>
          <Check size={14} /> {pending ? 'Saving…' : 'Save username'}
        </button>
      </div>
    </div>
  )
}
