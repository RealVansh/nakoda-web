'use client'

import { useEffect, useRef, useState } from 'react'

interface StatItem {
  value: string
  label: string
}

function CountUpNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const duration = 2000
          const steps = 60
          const increment = target / steps
          let current = 0
          const timer = setInterval(() => {
            current += increment
            if (current >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(current))
            }
          }, duration / steps)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  )
}

function TextStat({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <span
      ref={ref}
      className={`transition-all duration-1000 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {value}
    </span>
  )
}

export function CountUpStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center">
      {stats.map((stat, index) => {
        const numericMatch = stat.value.match(/^(\d+)(.*)$/)

        return (
          <div key={stat.label} className="flex flex-col sm:flex-row items-center">
            {/* Stat content */}
            <div className="text-center px-10 md:px-16 py-8 sm:py-4">
              <div className="text-5xl md:text-6xl font-light text-primary mb-5 tracking-tight">
                {numericMatch ? (
                  <CountUpNumber
                    target={parseInt(numericMatch[1])}
                    suffix={numericMatch[2] || ''}
                  />
                ) : (
                  <TextStat value={stat.value} />
                )}
              </div>
              <div className="h-px w-10 bg-primary/30 mx-auto mb-5" />
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground whitespace-nowrap">
                {stat.label}
              </p>
            </div>

            {/* Vertical divider between stats (not after the last one) */}
            {index < stats.length - 1 && (
              <div className="hidden sm:block w-px h-20 bg-border/50" />
            )}

            {/* Horizontal divider on mobile */}
            {index < stats.length - 1 && (
              <div className="sm:hidden w-16 h-px bg-border/50 mx-auto" />
            )}
          </div>
        )
      })}
    </div>
  )
}
