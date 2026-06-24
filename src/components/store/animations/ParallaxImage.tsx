'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface ParallaxImageProps {
  children: ReactNode
  className?: string
  /** Speed factor: 0.9 = subtle (90% scroll speed), 0.7 = dramatic */
  speed?: number
}

export function ParallaxImage({ children, className, speed = 0.9 }: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const yOffset = (1 - speed) * 100
  const y = useTransform(scrollYProgress, [0, 1], [`-${yOffset}px`, `${yOffset}px`])

  return (
    <div ref={ref} className={`overflow-hidden ${className || ''}`}>
      <motion.div style={{ y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  )
}
