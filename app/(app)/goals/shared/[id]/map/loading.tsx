import { Skeleton } from '@/components/ui/skeleton'

export default function SharedGoalMapLoading() {
  return (
    <div className="max-w-xs mx-auto p-4 flex flex-col gap-6">
      <Skeleton className="h-10 w-40" />
      {[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
    </div>
  )
}
