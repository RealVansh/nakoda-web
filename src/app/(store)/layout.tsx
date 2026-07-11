import { ReactNode } from 'react'
import { getCategories } from '@/actions/category.actions'
import { StoreNavbar } from '@/components/store/StoreNavbar'
import { Footer } from '@/components/store/Footer'
import { CartProvider } from '@/context/CartContext'
import { CartDrawer } from '@/components/store/CartDrawer'

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const rawCategories = await getCategories()
  
  // Custom sort: Bangles -> Necklaces -> Rings -> Earrings -> Others
  const targetOrder = ['bangle', 'necklace', 'ring', 'earring']
  const categories = [...rawCategories].sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    
    let aIndex = targetOrder.findIndex(keyword => aName.includes(keyword))
    let bIndex = targetOrder.findIndex(keyword => bName.includes(keyword))
    
    if (aIndex === -1) aIndex = 99
    if (bIndex === -1) bIndex = 99
    
    if (aIndex !== bIndex) return aIndex - bIndex
    return a.name.localeCompare(b.name)
  })

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background relative">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-primary text-primary-foreground px-4 py-2 rounded shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
          Skip to content
        </a>
        {/* Navbar */}
        <StoreNavbar categories={categories} />

        {/* Main Content */}
        <main id="main-content" className="flex-grow">
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
