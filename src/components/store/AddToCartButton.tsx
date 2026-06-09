'use client'

import { useCart, type CartItem } from '@/context/CartContext'
import { ShoppingBag, Check } from 'lucide-react'

interface AddToCartButtonProps {
  product: CartItem
  variant?: 'default' | 'compact'
  className?: string
  disabled?: boolean
}

export function AddToCartButton({ product, variant = 'default', className = '', disabled = false }: AddToCartButtonProps) {
  const { addToCart, isInCart } = useCart()
  const inCart = isInCart(product.id)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    // Instead of toggling, only add to cart. Removal happens in the cart drawer.
    if (!inCart) {
      addToCart(product)
    }
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        disabled={disabled || inCart}
        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 active:scale-95 ${
          disabled
            ? 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
            : inCart
              ? 'bg-primary/10 text-primary border border-primary/30 cursor-default active:scale-100'
              : 'bg-primary text-white hover:bg-primary-dark cursor-pointer'
        } ${className}`}
        aria-label={inCart ? `Added ${product.name}` : disabled ? `Sold Out` : `Add ${product.name} to cart`}
      >
        {disabled && !inCart ? (
          'Sold Out'
        ) : inCart ? (
          <>
            <Check className="h-3.5 w-3.5" />
            Added
          </>
        ) : (
          <>
            <ShoppingBag className="h-3.5 w-3.5" />
            Add to Cart
          </>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || inCart}
      className={`flex-1 flex items-center justify-center gap-2 font-medium py-4 px-8 rounded-sm text-center transition-all duration-200 uppercase tracking-wider text-sm active:scale-95 ${
        disabled
          ? 'bg-secondary text-muted-foreground border-2 border-border cursor-not-allowed opacity-50'
          : inCart
            ? 'bg-primary/10 text-primary border-2 border-primary cursor-default active:scale-100'
            : 'bg-primary text-white hover:bg-primary-dark border-2 border-primary cursor-pointer'
      } ${className}`}
      aria-label={inCart ? `Added ${product.name}` : disabled ? `Sold Out` : `Add ${product.name} to cart`}
    >
      {disabled && !inCart ? (
        'Sold Out'
      ) : inCart ? (
        <>
          <Check className="h-5 w-5" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingBag className="h-5 w-5" />
          Add to Cart
        </>
      )}
    </button>
  )
}
