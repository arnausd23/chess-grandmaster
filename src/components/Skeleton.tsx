interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-300 rounded ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="flex items-center gap-6">
      <div className="flex-shrink-0 w-16 text-center">
        <Skeleton className="h-8 w-12 mx-auto" />
      </div>
      <div className="bg-white rounded-lg shadow-md w-full p-6 mb-4 flex items-center gap-6">
        <div className="flex-shrink-0">
          <Skeleton className="w-20 h-20 rounded-full" />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="flex-shrink-0">
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="mb-6 h-10 w-32 rounded-lg" />

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <Skeleton className="w-32 h-32 rounded-full" />
          </div>

          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-64" />
            
            <div className="space-y-3 pt-4">
              <Skeleton className="h-5 w-full max-w-xs" />
              <Skeleton className="h-5 w-full max-w-sm" />
              <Skeleton className="h-5 w-full max-w-md" />
              <Skeleton className="h-5 w-full max-w-lg" />
              <Skeleton className="h-5 w-full max-w-xs" />
              <Skeleton className="h-5 w-full max-w-sm" />
            </div>

            <div className="flex gap-2 pt-4">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="pt-6">
              <Skeleton className="h-10 w-48 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


