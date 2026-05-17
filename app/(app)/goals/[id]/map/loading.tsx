export default function GoalMapLoading() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      {/* header skeleton */}
      <div className="skeleton h-24 rounded-2xl" />
      {/* path skeleton */}
      <div className="skeleton rounded-2xl" style={{ height: 520 }} />
    </div>
  )
}
