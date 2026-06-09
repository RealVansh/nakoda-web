import { getRelatedProducts } from '@/actions/product.actions'
import { ProductCard } from './ProductCard'

export async function RelatedProducts({
  categoryId,
  currentProductId,
}: {
  categoryId: string | null
  currentProductId: string
}) {
  const products = await getRelatedProducts(categoryId, currentProductId, 4)

  if (products.length === 0) return null

  return (
    <section className="mt-24 border-t border-border pt-16">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold tracking-widest text-foreground uppercase font-serif">
          You May Also Like
        </h2>
        <div className="h-1 w-16 bg-primary mx-auto mt-4"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              image_url: product.product_images?.[0]?.image_url || null,
              image_alt: product.product_images?.[0]?.alt_text || product.name,
              image_url_2: product.product_images?.[1]?.image_url || null,
              category_name: product.categories?.name || null,
              metal_type: product.metal_type,
              purity: product.purity,
              in_stock: product.in_stock,
              badges: product.badges,
            }}
          />
        ))}
      </div>
    </section>
  )
}
