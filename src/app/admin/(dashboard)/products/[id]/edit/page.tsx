import { ProductForm } from '@/components/admin/ProductForm'
import { getProductById } from '@/actions/product.actions'
import { getCategories } from '@/actions/category.actions'
import { getCollections } from '@/actions/collection.actions'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  
  const [product, categories, collections] = await Promise.all([
    getProductById(resolvedParams.id),
    getCategories(),
    getCollections()
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Product</h1>
        <p className="text-muted-foreground mt-1">Update product details and manage gallery images.</p>
      </div>

      <div className="bg-background shadow-sm border border-border rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <ProductForm 
            initialData={product}
            categories={categories}
            collections={collections}
          />
        </div>
      </div>
    </div>
  )
}
