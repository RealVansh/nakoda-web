import { getCategories } from '@/actions/category.actions'
import { CategoryForm } from '@/components/admin/CategoryForm'
import { DeleteCategoryButton } from '@/components/admin/DeleteCategoryButton'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const categories = await getCategories()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Categories</h1>
        <p className="text-muted-foreground mt-1">Manage product categories and tags.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-background border border-border rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-foreground mb-4">Add New Category</h2>
            <CategoryForm />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-background border border-border shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-secondary/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DeleteCategoryButton id={category.id} name={category.name} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No categories found. Create one using the form.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
