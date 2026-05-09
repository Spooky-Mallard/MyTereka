export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style:                 'currency',
    currency:              'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDateUG(iso: string): string {
  return new Intl.DateTimeFormat('en-UG', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  }).format(new Date(iso))
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
