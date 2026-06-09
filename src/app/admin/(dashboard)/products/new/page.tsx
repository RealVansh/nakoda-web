import { ProductForm } from '@/components/admin/ProductForm'
import { getCategories } from '@/actions/category.actions'
import { getCollections } from '@/actions/collection.actions'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    getCategories(),
    getCollections()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Add New Product</h1>
        <p className="text-muted-foreground mt-1">Create a new piece of jewellery to showcase in your store.</p>
      </div>

      <div className="bg-background shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ProductForm 
            categories={categories}
            collections={collections}
          />
        </div>
      </div>
    </div>
  )
}
