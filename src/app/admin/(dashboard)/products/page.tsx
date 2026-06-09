import { getProducts } from '@/actions/product.actions'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your jewellery items here.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Product
        </Link>
      </div>

      <div className="bg-background border border-border shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-secondary/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{product.name}</div>
                      <div className="text-sm text-muted-foreground">{product.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {product.categories?.name || 'Uncategorized'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.in_stock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          <Pencil className="h-5 w-5" />
                          <span className="sr-only">Edit</span>
                        </Link>
                        <DeleteProductButton id={product.id} name={product.name} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    No products found. Click &quot;Add Product&quot; to create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
