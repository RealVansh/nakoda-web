import { ReactNode } from 'react'
import { getCategories } from '@/actions/category.actions'
import { StoreNavbar } from '@/components/store/StoreNavbar'
import { Footer } from '@/components/store/Footer'
import { CartProvider } from '@/context/CartContext'
import { CartDrawer } from '@/components/store/CartDrawer'

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const categories = await getCategories()

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Navbar */}
        <StoreNavbar categories={categories} />

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <Footer />

        {/* Cart Drawer */}
        <CartDrawer />
      </div>
    </CartProvider>
  )
}
