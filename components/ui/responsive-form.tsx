"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveFormProps {
  children: ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
}

const maxWidthClasses = {
  sm: "max-w-md",
  md: "max-w-lg", 
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl"
}

export function ResponsiveForm({ 
  children, 
  className,
  maxWidth = "xl"
}: ResponsiveFormProps) {
  return (
    <div className={cn(
      "w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveFormSectionProps {
  children: ReactNode
  title?: string
  description?: string
  icon?: ReactNode
  className?: string
}

export function ResponsiveFormSection({ 
  children, 
  title,
  description,
  icon,
  className 
}: ResponsiveFormSectionProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
      "p-4 sm:p-6 lg:p-8 space-y-6",
      className
    )}>
      {(title || description) && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          {title && (
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
              {icon && <span className="text-2xl sm:text-3xl">{icon}</span>}
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

interface ResponsiveFormGridProps {
  children: ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  className?: string
}

export function ResponsiveFormGrid({ 
  children, 
  cols = { default: 1, md: 2 },
  className 
}: ResponsiveFormGridProps) {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`
  ].filter(Boolean).join(" ")

  return (
    <div className={cn(
      "grid gap-4 sm:gap-6 lg:gap-8",
      gridCols,
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveFormFieldProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function ResponsiveFormField({ 
  children, 
  className,
  fullWidth = false 
}: ResponsiveFormFieldProps) {
  return (
    <div className={cn(
      "space-y-2",
      fullWidth && "col-span-full",
      className
    )}>
      {children}
    </div>
  )
}