'use client'

import { createContext, useContext, useState, useCallback, useSyncExternalStore, type ReactNode } from 'react'

export type CartItem = {
  id: string
  name: string
  slug: string
  image_url: string | null
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
  return () => window.removeEventListener('storage', callback)
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
}

export function CartProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [items, setItems] = useState<CartItem[]>(() => parseCart(stored))
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev
      const next = [...prev, item]
      persistCart(next)
      return next
    })
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      persistCart(next)
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
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
