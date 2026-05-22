'use client'

import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { submitAppRating } from '@/lib/actions/profile'

type Props = {
  open:    boolean
  onClose: () => void
}

export function RatingModal({ open, onClose }: Props) {
  const [hovered,  setHovered]  = useState(0)
  const [selected, setSelected] = useState(0)
  const [pending,  start]       = useTransition()

  function handleSubmit() {
    if (!selected) { toast.error('Please select a rating'); return }
    start(async () => {
      try {
        await submitAppRating(selected)
        toast.success('Thanks for your feedback!')
        onClose()
      } catch {
        toast.error('Could not save rating')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg">How are you liking MyTereka?</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-4">
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setSelected(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                strokeWidth={1.5}
                fill={(hovered || selected) >= n ? 'var(--warning)' : 'transparent'}
                color={(hovered || selected) >= n ? 'var(--warning)' : 'var(--muted-foreground)'}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={pending || !selected}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {pending ? 'Saving…' : 'Submit'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
