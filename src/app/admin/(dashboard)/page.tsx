import { getProducts } from '@/actions/product.actions'
import { getInquiries } from '@/actions/inquiry.actions'
import { getCategories } from '@/actions/category.actions'
import { Package, MessageSquare, Tags } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [products, inquiries, categories] = await Promise.all([
    getProducts(),
    getInquiries(),
    getCategories(),
  ])

  const stats = [
    {
      name: 'Total Products',
      value: products.length.toString(),
      icon: Package,
    },
    {
      name: 'Customer Inquiries',
      value: inquiries.length.toString(),
      icon: MessageSquare,
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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

      <div className="mt-8 bg-background border border-border rounded-lg shadow-sm">
        <div className="px-6 py-5 border-b border-border">
          <h3 className="text-base font-semibold leading-6 text-foreground">
            Recent Inquiries
          </h3>
        </div>
        <div className="px-6 py-5">
          {inquiries.length > 0 ? (
            <ul className="divide-y divide-border">
              {inquiries.slice(0, 5).map((inquiry) => (
                <li key={inquiry.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{inquiry.customer_name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{inquiry.message.substring(0, 100)}...</p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-sm text-muted-foreground">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent inquiries.</p>
          )}
        </div>
      </div>
    </div>
  )
}
