"use client";

// Placeholder loading — bar surface-soft dengan pulse halus.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-soft rounded-md animate-pulse ${className}`} />;
}

// Kartu skeleton siap-pakai untuk grid.
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[12px] border border-hairline p-6 space-y-3 ${className}`}>
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export default Skeleton;
