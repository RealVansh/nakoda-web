'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

export function ProductGallery({ images }: { images: { url: string; alt: string | null }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 })
  const imageRef = useRef<HTMLDivElement>(null)

  // Touch swipe support
  const touchStartX = useRef(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1)
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1)
      }
    }
  }, [currentIndex, images.length])

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-secondary flex items-center justify-center text-muted-foreground">
        No images available
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnails */}
      <div className="flex lg:flex-col gap-3 overflow-auto">
        {images.map((img, idx) => (
          <button
            type="button"
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`View image ${idx + 1}`}
            aria-pressed={currentIndex === idx}
            className={`relative w-20 h-20 flex-shrink-0 border-2 rounded-sm overflow-hidden transition-all ${
              currentIndex === idx
                ? 'border-primary shadow-[0_0_8px_rgba(212,175,55,0.3)]'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <Image src={img.url} alt={img.alt || 'Thumbnail'} fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      {/* Main Image with Zoom */}
      <div
        ref={imageRef}
        className="relative aspect-square flex-grow bg-secondary cursor-crosshair overflow-hidden rounded-sm"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || 'Product Image'}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={`object-cover transition-transform duration-200 ${
            isZoomed ? 'scale-[2.5]' : 'scale-100'
          }`}
          style={isZoomed ? {
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
          } : undefined}
          priority={currentIndex === 0}
        />

        {/* Zoom hint */}
        {!isZoomed && images[currentIndex] && (
          <div className="absolute bottom-3 right-3 bg-background/70 backdrop-blur-sm text-foreground text-xs px-3 py-1.5 rounded-full pointer-events-none hidden lg:block">
            Hover to zoom
          </div>
        )}

        {/* Mobile swipe dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 lg:hidden">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex ? 'bg-primary' : 'bg-foreground/30'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
