"use client"

import { useState, useEffect } from 'react'

interface ScreenSize {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024
} as const

export function useResponsive(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1024,
    height: 768
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        isMobile: width < BREAKPOINTS.mobile,
        isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
        isDesktop: width >= BREAKPOINTS.tablet,
        width,
        height
      })
    }

    // Set initial size
    updateScreenSize()

    // Add event listener
    window.addEventListener('resize', updateScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

export function useIsMobile(): boolean {
  const { isMobile } = useResponsive()
  return isMobile
}

export function useIsTablet(): boolean {
  const { isTablet } = useResponsive()
  return isTablet
}

export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive()
  return isDesktop
}