'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react'

interface ShowcaseProduct {
  id: string
  name: string
  slug: string
  image_url: string | null
  image_alt: string
  category_name: string | null
}

interface ProductShowcaseProps {
  products: ShowcaseProduct[]
}

export function ProductShowcase({ products }: ProductShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)

  const total = products.length

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total)
  }, [total])

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  // Auto-play: rotate every 5s, pause on hover or if user interacted (paused)
  useEffect(() => {
    if (isPaused || total <= 1) return
    const timer = setInterval(goNext, 5000)
    return () => clearInterval(timer)
  }, [isPaused, goNext, total])

  const getPosition = (index: number) => {
    const diff = (index - activeIndex + total) % total
    if (diff === 0) return 'center'
    if (diff === 1 || (diff === total - 1 && total === 2)) return 'right'
    if (diff === total - 1) return 'left'
    return 'hidden'
  }

  const positionStyles = {
    center: {
      x: 0,
      scale: 1,
      rotateY: 0,
      zIndex: 30,
      opacity: 1,
    },
    left: {
      x: '-60%',
      scale: 0.75,
      rotateY: 15,
      zIndex: 20,
      opacity: 0.5,
    },
    right: {
      x: '60%',
      scale: 0.75,
      rotateY: -15,
      zIndex: 20,
      opacity: 0.5,
    },
    hidden: {
      x: 0,
      scale: 0.5,
      rotateY: 0,
      zIndex: 10,
      opacity: 0,
    },
  }

  const activeProduct = products[activeIndex]
  if (total === 0) return null

  return (
    <div
      className="relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
      onMouseEnter={() => !userInteracted && setIsPaused(true)}
      onMouseLeave={() => !userInteracted && setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Products"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') goPrev()
        if (e.key === 'ArrowRight') goNext()
      }}
    >
      <div aria-live="polite" className="sr-only">
        Showing product {activeIndex + 1} of {total}: {activeProduct.name}
      </div>
      {/* 3D Carousel */}
      <div className="perspective-container relative h-[400px] sm:h-[500px] lg:h-[550px] w-full max-w-4xl mx-auto">
        {products.map((product, index) => {
          const position = getPosition(index)

          return (
            <motion.div
              key={product.id}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              animate={positionStyles[position]}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => {
                if (position === 'left') goPrev()
                else if (position === 'right') goNext()
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Link
                href={`/products/${product.slug}`}
                className={`block relative w-[280px] sm:w-[320px] lg:w-[380px] aspect-square rounded-sm overflow-hidden border border-border group ${
                  position !== 'center' ? 'pointer-events-none' : ''
                }`}
                onClick={(e) => {
                  if (position !== 'center') e.preventDefault()
                }}
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.image_alt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 380px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}
                {/* Subtle gold border glow on center card hover */}
                {position === 'center' && (
                  <div className="absolute inset-0 border border-transparent group-hover:border-primary/40 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.1)] transition-all duration-500 z-10" />
                )}
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Product Info — below carousel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeProduct.id}
          className="text-center mt-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <Link href={`/products/${activeProduct.slug}`} className="group">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground capitalize tracking-wide group-hover:text-primary transition-colors">
              {activeProduct.name}
            </h3>
            {activeProduct.category_name && (
              <p className="text-sm text-muted-foreground mt-2 uppercase tracking-widest">
                {activeProduct.category_name}
              </p>
            )}
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {total > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Previous product"
          >
            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 p-2 sm:p-3 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Next product"
          >
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </>
      )}

      {/* Controls: Play/Pause and Dots */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => {
              setIsPaused(!isPaused)
              setUserInteracted(true)
            }}
            className="p-1.5 text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
            aria-label={isPaused ? "Play carousel" : "Pause carousel"}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
          </button>
          
          <div className="flex gap-2">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  index === activeIndex
                    ? 'w-8 bg-primary'
                    : 'w-1.5 bg-border hover:bg-muted-foreground'
                }`}
                aria-label={`Go to product ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
