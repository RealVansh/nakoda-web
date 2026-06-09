import { getProducts } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import { Package, Tags } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  const stats = [
    {
      name: 'Total Products',
      value: products.length.toString(),
      icon: Package,
    },
    {
      name: 'Categories',
      value: categories.length.toString(),
      icon: Tags,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your jewellery store.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.name}
              className="bg-background overflow-hidden rounded-lg border border-border px-4 py-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary/10 rounded-md p-3">
                  <Icon className="h-6 w-6 text-primary-dark" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="truncate text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-2xl font-semibold text-foreground">
                      {stat.value}
                    </div>
                  </dd>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
