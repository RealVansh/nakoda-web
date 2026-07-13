'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { SearchOverlay } from '@/components/store/SearchOverlay'

export function StoreNavbar({ categories }: { categories: { id: string; name: string }[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { cartCount, setIsCartOpen } = useCart()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  // Frosted glass effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border/50 shadow-lg shadow-black/5'
          : 'bg-background border-b border-border'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex justify-start items-center">
            <Link href="/" className="flex flex-col -ml-4">
              <Image src="/images/nakoda_logo.png" alt="Nakoda Jewellers" width={180} height={50} className="object-contain" priority />
            </Link>
          </div>
          
          {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 items-center">
            <Link href="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Home</Link>
            <Link href="/products" className={`text-sm font-medium transition-colors ${isActive('/products') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>All Collections</Link>
            <div 
              className="relative group"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="text-foreground hover:text-primary transition-colors text-sm font-medium flex items-center cursor-pointer"
              >
                Categories
              </button>
              <div 
                className={`absolute left-0 mt-2 w-48 bg-secondary border border-border shadow-lg rounded-md transition-all duration-200 origin-top-left ${
                  isDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto visible' : 'opacity-0 scale-95 pointer-events-none invisible'
                }`}
              >
                <div className="py-1">
                  {categories.map((c) => (
                    <Link key={c.id} href={`/products?category=${c.id}`} className="block px-4 py-2 text-sm text-foreground hover:bg-background hover:text-primary transition-colors">
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/about" className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>About</Link>
            <Link href="/contact" className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-primary' : 'text-foreground hover:text-primary'}`}>Contact Us</Link>

            {/* Search */}
            <SearchOverlay />

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground hover:text-primary transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </nav>

          {/* Mobile: Search + Cart + Menu */}
          <div className="md:hidden flex items-center gap-1">
            <SearchOverlay />
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground hover:text-primary transition-colors cursor-pointer"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground hover:text-primary focus:outline-none cursor-pointer"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Backdrop */}
      <div 
        className={`md:hidden fixed inset-0 top-20 bg-black/40 z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Nav Menu */}
      <div 
        className={`md:hidden fixed top-20 left-0 w-full max-w-sm h-[calc(100vh-5rem)] bg-background border-r border-border shadow-lg z-50 overflow-y-auto transform transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 visible' : '-translate-x-full invisible'
        }`}
      >
        <div className="px-2 pt-2 pb-6 space-y-1 sm:px-3 h-full flex flex-col">
          <Link href="/" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-secondary'}`}>Home</Link>
          <Link href="/products" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/products') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-secondary'}`}>All Collections</Link>
          
          <div className="px-3 pt-4 pb-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">Categories</div>
          <div className="pl-4 space-y-1 mb-4 border-l-2 border-border/50 ml-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/products?category=${c.id}`} onClick={() => setIsOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-foreground hover:text-primary hover:bg-secondary">
                {c.name}
              </Link>
            ))}
          </div>

          <Link href="/about" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/about') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-secondary'}`}>About</Link>
          <Link href="/contact" onClick={() => setIsOpen(false)} className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/contact') ? 'text-primary bg-primary/5' : 'text-foreground hover:text-primary hover:bg-secondary'}`}>Contact Us</Link>
        </div>
      </div>
    </header>
  )
}
