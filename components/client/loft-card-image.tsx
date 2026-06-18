"use client"

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react"
import Image from "next/image"
import { Home } from "lucide-react"

interface LoftCardImageProps {
  photos: Array<{ id: string; url: string; order_index?: number; display_order?: number }>
  name: string
  children?: ReactNode
  sizes?: string
}

const HOVER_DELAY = 400
const SLIDE_INTERVAL = 1000

export function LoftCardImage({ photos, name, children, sizes }: LoftCardImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const slideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sortedPhotos = photos
    .slice()
    .sort((a, b) => {
      const oa = a.order_index ?? a.display_order ?? 999
      const ob = b.order_index ?? b.display_order ?? 999
      return oa - ob
    })
    .map(p => p.url)
    .filter(url => url && typeof url === 'string' && url.trim().length > 0)

  const hasMultiplePhotos = sortedPhotos.length > 1

  const clearAllTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    if (slideTimerRef.current) {
      clearInterval(slideTimerRef.current)
      slideTimerRef.current = null
    }
  }, [])

  const startAutoPlay = useCallback(() => {
    if (!hasMultiplePhotos) return
    setIsAutoPlaying(true)
    slideTimerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % sortedPhotos.length)
    }, SLIDE_INTERVAL)
  }, [hasMultiplePhotos, sortedPhotos.length])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
    if (!hasMultiplePhotos) return
    hoverTimerRef.current = setTimeout(() => {
      startAutoPlay()
    }, HOVER_DELAY)
  }, [hasMultiplePhotos, startAutoPlay])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    clearAllTimers()
    setIsAutoPlaying(false)
    setCurrentIndex(0)
  }, [clearAllTimers])

  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  if (!sortedPhotos.length) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
        <Home className="h-16 w-16 text-neutral-300 dark:text-neutral-600" />
        {children}
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {sortedPhotos.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`${name} - Photo ${index + 1}`}
          fill
          sizes={sizes || "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
          className={`object-cover transition-all duration-[700ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            index === currentIndex
              ? "scale-100 opacity-100"
              : index === (currentIndex + 1) % sortedPhotos.length && isAutoPlaying
                ? "scale-[1.03] opacity-0"
                : "scale-[0.97] opacity-0"
          }`}
          draggable={false}
        />
      ))}

      {children}

      {hasMultiplePhotos && (isHovered || isAutoPlaying) && (
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
          {sortedPhotos.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-4 bg-white"
                  : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      {isAutoPlaying && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-medium text-white">Auto</span>
        </div>
      )}
    </div>
  )
}
