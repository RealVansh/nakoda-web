'use client'

import { useCart } from '@/context/CartContext'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, clearCart } = useCart()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nakodajewellers.com'

  function generateWhatsAppUrl() {
    if (items.length === 0) return '#'

    let message = "Hi, I'm interested in the following products:\n\n"
    items.forEach((item, index) => {
      const details = []
      if (item.weight) details.push(`${item.weight}g`)
      if (item.purity) details.push(item.purity)
      const detailsStr = details.length > 0 ? ` (${details.join(', ')})` : ''
      message += `${index + 1}. ${item.name}${detailsStr}\n   ${siteUrl}/products/${item.slug}\n\n`
    })
    message += 'Please share pricing and availability details.'

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-[60] transition-all duration-300 ${
          isCartOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-2xl z-[70] transform transition-all duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Your Selections ({items.length})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Browse our collections and add pieces you love
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsCartOpen(false)}
                  className="text-sm text-primary hover:text-primary-dark font-medium underline underline-offset-4"
                >
                  Continue Shopping
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/20 transition-colors"
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="relative w-16 h-16 flex-shrink-0 bg-secondary rounded-md overflow-hidden"
                    >
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={() => setIsCartOpen(false)}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 font-serif capitalize"
                      >
                        {item.name}
                      </Link>
                      {(item.category_name || item.purity || item.metal_type || item.weight) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {[
                            item.category_name, 
                            [item.purity, item.metal_type].filter(Boolean).join(' '),
                            item.weight ? `${item.weight}g` : null
                          ].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex-shrink-0 p-2 text-muted-foreground hover:text-red-600 transition-colors rounded-md hover:bg-red-950/30"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-6 py-4 border-t border-border space-y-3">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3.5 px-4 rounded-lg transition-colors text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Send Inquiry via WhatsApp
              </a>
              {showClearConfirm ? (
                <div className="flex flex-col items-center p-2 rounded-lg bg-red-50 border border-red-100 mb-2">
                  <p className="text-sm text-red-800 mb-3 font-medium">Are you sure?</p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="flex-1 py-2 text-sm bg-white border border-border rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        clearCart()
                        setShowClearConfirm(false)
                      }}
                      className="flex-1 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full text-sm text-muted-foreground hover:text-red-600 transition-colors py-2"
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
