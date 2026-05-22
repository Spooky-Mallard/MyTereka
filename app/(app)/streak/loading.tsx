import { Skeleton } from '@/components/ui/skeleton'

export default function StreakLoading() {
  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  )
}
