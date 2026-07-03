export function MovieCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[2/3] rounded-xl shimmer" />
      <div className="mt-2.5 space-y-2">
        <div className="h-3.5 w-3/4 rounded shimmer" />
        <div className="h-3 w-1/2 rounded shimmer" />
      </div>
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[70vh] w-full">
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6 px-4 md:px-8 pt-8">
      <div className="h-8 w-2/3 rounded shimmer" />
      <div className="h-4 w-1/3 rounded shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded shimmer" />
        <div className="h-3 w-5/6 rounded shimmer" />
        <div className="h-3 w-4/6 rounded shimmer" />
      </div>
    </div>
  );
}
