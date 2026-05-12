const MTN_FEES: Array<[number, number, number]> = [
  [500,         2500,       330],
  [2501,        5000,       440],
  [5001,        15000,      700],
  [15001,       30000,      880],
  [30001,       45000,      1210],
  [45001,       60000,      1500],
  [60001,       125000,     1925],
  [125001,      250000,     3575],
  [250001,      500000,     7000],
  [500001,      1000000,    12500],
  [1000001,     2000000,    15000],
  [2000001,     4000000,    18000],
  [4000001,     5000000,    20000],
]
const MTN_MAX = 5_000_000

const AIRTEL_FEES: Array<[number, number, number]> = [
  [1000,        2500,       330],
  [2501,        5000,       440],
  [5001,        15000,      700],
  [15001,       30000,      880],
  [30001,       45000,      1100],
  [45001,       60000,      1500],
  [60001,       125000,     1925],
  [125001,      250000,     3300],
  [250001,      500000,     6600],
  [500001,      1000000,    12500],
  [1000001,     2000000,    15000],
  [2000001,     3000000,    22500],
]
const AIRTEL_MAX = 7_000_000

export type FeeResult =
  | { type: 'none' }
  | { type: 'out_of_range'; min: number; max: number; provider: string }
  | { type: 'fee'; provider: string; fee: number; total: number }

export function calcMoMoFee(accountName: string, amount: number): FeeResult {
  const name = accountName.toLowerCase()
  const isMtn    = name.includes('mtn')
  const isAirtel = name.includes('airtel')
  if (!isMtn && !isAirtel) return { type: 'none' }

  if (isMtn) {
    if (amount < 500 || amount > MTN_MAX)
      return { type: 'out_of_range', min: 500, max: MTN_MAX, provider: 'MTN MoMo' }
    const row = MTN_FEES.find(([lo, hi]) => amount >= lo && amount <= hi)
    const fee = row ? row[2] : 20000
    return { type: 'fee', provider: 'MTN MoMo', fee, total: amount + fee }
  }

  if (amount < 1000 || amount > AIRTEL_MAX)
    return { type: 'out_of_range', min: 1000, max: AIRTEL_MAX, provider: 'Airtel Money' }
  if (amount > 3_000_000) {
    const fee = Math.round(amount * 0.005)
    return { type: 'fee', provider: 'Airtel Money', fee, total: amount + fee }
  }
  const row = AIRTEL_FEES.find(([lo, hi]) => amount >= lo && amount <= hi)
  const fee = row ? row[2] : 22500
  return { type: 'fee', provider: 'Airtel Money', fee, total: amount + fee }
}
