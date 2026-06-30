export default function JobCardSkeleton() {
  return (
    <div className="card border-l-4 border-l-gray-200 p-5 flex flex-col gap-3 h-full animate-pulse">
      {/* DeadlineBar placeholder */}
      <div className="h-1.5 bg-gray-200 rounded-full w-full" />

      {/* Status badge + category */}
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>

      {/* Org name */}
      <div className="h-3.5 w-36 bg-gray-200 rounded" />

      {/* Title — 2 lines */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-4/5 bg-gray-200 rounded" />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-auto">
        <div className="h-3.5 w-20 bg-gray-200 rounded" />
        <div className="h-3.5 w-24 bg-gray-200 rounded" />
      </div>

      {/* Deadline */}
      <div className="pt-3 border-t border-warm-border">
        <div className="h-3.5 w-40 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
