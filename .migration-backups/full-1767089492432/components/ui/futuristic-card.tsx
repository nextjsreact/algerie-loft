"use client"

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface FuturisticCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  gradient?: boolean
}

export function FuturisticCard({ 
  children, 
  className, 
  hover = true,
  gradient = false 
}: FuturisticCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-xl transition-all duration-300",
        hover && "hover:shadow-2xl hover:scale-[1.02] hover:border-blue-200/50 dark:hover:border-blue-800/50",
        gradient && "bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-950/50",
        className
      )}
    >
      {children}
    </div>
  )
}

interface FuturisticCardHeaderProps {
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function FuturisticCardHeader({ 
  children, 
  className,
  gradient = false 
}: FuturisticCardHeaderProps) {
  return (
    <div
      className={cn(
        "p-6 border-b border-white/20 dark:border-slate-700/50",
        gradient && "bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5",
        className
      )}
    >
      {children}
    </div>
  )
}

interface FuturisticCardContentProps {
  children: ReactNode
  className?: string
}

export function FuturisticCardContent({ children, className }: FuturisticCardContentProps) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  )
}

interface FuturisticCardTitleProps {
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function FuturisticCardTitle({ 
  children, 
  className,
  gradient = true 
}: FuturisticCardTitleProps) {
  return (
    <h3
      className={cn(
        "text-xl font-bold",
        gradient 
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
          : "text-slate-900 dark:text-white",
        className
      )}
    >
      {children}
    </h3>
  )
}
