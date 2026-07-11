export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Image Gallery Skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="aspect-square bg-muted animate-pulse rounded-lg w-full" />
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-24 h-24 bg-muted animate-pulse rounded-md flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col pt-4 sm:pt-8">
          <div className="w-32 h-4 bg-muted animate-pulse rounded-full mb-6" />
          <div className="w-3/4 h-10 bg-muted animate-pulse rounded-md mb-8" />
          
          <div className="w-full h-24 bg-muted animate-pulse rounded-md mb-8" />
          
          <div className="space-y-4 mb-8">
            <div className="w-full h-4 bg-muted animate-pulse rounded-full" />
            <div className="w-5/6 h-4 bg-muted animate-pulse rounded-full" />
            <div className="w-4/6 h-4 bg-muted animate-pulse rounded-full" />
          </div>

          <div className="w-full h-14 bg-muted animate-pulse rounded-md mt-auto" />
        </div>
      </div>
    </div>
  )
}
