"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface FormWrapperProps {
  children: ReactNode
  className?: string
  title?: string
  description?: string
  icon?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "full"
}

export function FormWrapper({ 
  children, 
  className, 
  title, 
  description, 
  icon,
  maxWidth = "2xl" 
}: FormWrapperProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    full: "max-w-full"
  }

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className={cn("mx-auto", maxWidthClasses[maxWidth])}>
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                {icon && <span className="mr-3 text-4xl">{icon}</span>}
                {title}
              </h1>
            )}
            {description && (
              <p className="text-gray-600 text-lg">{description}</p>
            )}
          </div>
        )}
        <div className={cn("space-y-8", className)}>
          {children}
        </div>
      </div>
    </div>
  )
}

interface FormSectionProps {
  children: ReactNode
  title?: string
  description?: string
  icon?: string
  className?: string
  colorScheme?: "default" | "blue" | "yellow" | "green" | "purple" | "red"
}

export function FormSection({ 
  children, 
  title, 
  description, 
  icon, 
  className,
  colorScheme = "default"
}: FormSectionProps) {
  const colorSchemes = {
    default: "bg-white border-gray-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200", 
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    red: "bg-red-50 border-red-200"
  }

  const titleColors = {
    default: "text-gray-800",
    blue: "text-blue-900",
    yellow: "text-yellow-900",
    green: "text-green-900", 
    purple: "text-purple-900",
    red: "text-red-900"
  }

  return (
    <div className={cn(
      "p-6 rounded-lg shadow-md border",
      colorSchemes[colorScheme],
      className
    )}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className={cn(
              "text-2xl font-bold border-b pb-4 mb-4 flex items-center",
              titleColors[colorScheme]
            )}>
              {icon && <span className="mr-3 text-3xl">{icon}</span>}
              {title}
            </h2>
          )}
          {description && (
            <p className="text-gray-600 -mt-2">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}