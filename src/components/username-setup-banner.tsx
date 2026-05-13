'use client'

import { useState } from 'react'
import { AtSign, X } from 'lucide-react'
import { UsernameEditModal } from './username-edit-modal'

export function UsernameSetupBanner({ initialUsername }: { initialUsername: string | null }) {
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState(false)

  if (initialUsername || dismissed) return null

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

      {open && <UsernameEditModal initialUsername={null} onClose={() => setOpen(false)} />}
    </>
  )
}
