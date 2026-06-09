export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 bg-border/50 rounded-md skeleton mb-4"></div>
        <div className="h-6 w-96 max-w-full bg-border/50 rounded-md skeleton"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Skeleton */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="h-10 w-full lg:hidden bg-border/50 rounded-lg skeleton mb-6"></div>
          <div className="hidden lg:block space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-6 w-24 bg-border/50 rounded skeleton"></div>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-8 w-16 bg-border/50 rounded-full skeleton"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col space-y-4">
              <div className="aspect-[4/5] bg-border/50 rounded-lg skeleton"></div>
              <div className="space-y-2">
                <div className="h-4 w-1/3 bg-border/50 rounded skeleton"></div>
                <div className="h-5 w-3/4 bg-border/50 rounded skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
