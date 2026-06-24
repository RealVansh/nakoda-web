'use client'

import { createContext, useContext, useCallback, useSyncExternalStore, useState, type ReactNode } from 'react'

export type CartItem = {
  id: string
  name: string
  slug: string
  image_url: string | null
  category_name?: string | null
  metal_type?: string | null
  purity?: string | null
  weight?: number | null
}

type CartContextType = {
  items: CartItem[]
  cartCount: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  addToCart: (item: CartItem) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
  isInCart: (id: string) => boolean
}

const CartContext = createContext<CartContextType | null>(null)

const CART_STORAGE_KEY = 'nakoda_cart'

// Storage subscription for useSyncExternalStore
function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  // Also listen for custom events so same-tab updates are caught
  window.addEventListener('nakoda-cart-update', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('nakoda-cart-update', callback)
  }
}

function getSnapshot() {
  return localStorage.getItem(CART_STORAGE_KEY) || '[]'
}

function getServerSnapshot() {
  return '[]'
}

function parseCart(raw: string): CartItem[] {
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function persistCart(items: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  // Dispatch custom event so same-tab useSyncExternalStore picks it up
  window.dispatchEvent(new Event('nakoda-cart-update'))
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Single source of truth: localStorage via useSyncExternalStore
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const items = parseCart(stored)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = useCallback((item: CartItem) => {
    const current = parseCart(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    if (current.some(i => i.id === item.id)) return
    persistCart([...current, item])
  }, [])

  const removeFromCart = useCallback((id: string) => {
    const current = parseCart(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    persistCart(current.filter(i => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    persistCart([])
  }, [])

  const isInCart = useCallback((id: string) => {
    return items.some(i => i.id === id)
  }, [items])

  return (
    <CartContext.Provider value={{
      items,
      cartCount: items.length,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      clearCart,
      isInCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
