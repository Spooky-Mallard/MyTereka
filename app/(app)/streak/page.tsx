import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getStreakPageData } from '@/lib/actions/profile'
import { Flame, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function todayEAT(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function buildCalendarMonths(activeDates: string[]): { year: number; month: number; days: { date: string; active: boolean; isToday: boolean; inMonth: boolean }[] }[] {
  const activeSet = new Set(activeDates)
  const today = todayEAT()
  const months = []
  const now = new Date(Date.now() + 3 * 60 * 60 * 1000)

  for (let m = 2; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    const year = d.getFullYear()
    const month = d.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDow = new Date(year, month, 1).getDay()

    const days: { date: string; active: boolean; isToday: boolean; inMonth: boolean }[] = []
    for (let p = 0; p < firstDow; p++) {
      days.push({ date: '', active: false, isToday: false, inMonth: false })
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      days.push({ date: dateStr, active: activeSet.has(dateStr), isToday: dateStr === today, inMonth: true })
    }
    months.push({ year, month, days })
  }
  return months
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default async function StreakPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const data = await getStreakPageData()
  const months = buildCalendarMonths(data.activeDates)

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-6 pb-24">
      <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
        ← Back
      </Link>

      <div className="card-base flex items-center gap-4">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl" style={{ background: 'var(--warning)', color: '#fff' }}>
          <Flame size={28} />
        </div>
        <div>
          <p className="text-3xl font-black" style={{ color: 'var(--warning)' }}>{data.streakCount}-day streak</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {data.streakCount === 0 ? 'Log a transaction today to start your streak!' : 'Keep it up!'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card-base flex flex-col gap-1">
          <div className="flex items-center gap-2" style={{ color: 'var(--warning)' }}>
            <Trophy size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Best Streak</span>
          </div>
          <p className="text-2xl font-black">{data.longestStreak} days</p>
        </div>
        <div className="card-base flex flex-col gap-1">
          <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
            <TrendingUp size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Active Days</span>
          </div>
          <p className="text-2xl font-black">{data.totalActiveDays}</p>
        </div>
      </div>

      {months.map(({ year, month, days }) => (
        <div key={`${year}-${month}`} className="card-base flex flex-col gap-3">
          <p className="font-bold text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {MONTH_NAMES[month]} {year}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S','M','T','W','T','F','S'].map((l, i) => (
              <span key={i} className="text-[10px] font-semibold pb-1" style={{ color: 'var(--muted-foreground)' }}>{l}</span>
            ))}
            {days.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day.inMonth ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: day.active ? 'var(--warning)' : day.isToday ? 'var(--muted)' : 'transparent',
                      color: day.active ? '#fff' : day.isToday ? 'var(--primary)' : 'var(--muted-foreground)',
                      outline: day.isToday && !day.active ? '2px solid var(--primary)' : 'none',
                      outlineOffset: '1px',
                    }}
                  >
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </div>
                ) : <div className="w-8 h-8" />}
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.history.length > 0 && (
        <div className="card-base flex flex-col gap-3">
          <p className="font-bold text-sm" style={{ color: 'var(--muted-foreground)' }}>Recent Streaks</p>
          {data.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Flame size={14} style={{ color: 'var(--warning)' }} />
                <span className="text-sm font-semibold">{h.length}-day streak</span>
              </div>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {h.startDate}{h.endDate && h.endDate !== h.startDate ? ` → ${h.endDate}` : ''}
                {!h.endDate ? ' · ongoing' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
