"use client"

import * as React from "react"
import { useState, useEffect } from "react"

// Safe Select component that only renders after hydration
interface SafeSelectProps {
  children: React.ReactNode
  onValueChange?: (value: string) => void
  defaultValue?: string
  value?: string
  disabled?: boolean
}

export function SafeSelect({ children, onValueChange, defaultValue, value, disabled }: SafeSelectProps) {
  const [mounted, setMounted] = useState(false)
  const [selectedValue, setSelectedValue] = useState(defaultValue || value || "")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value
    setSelectedValue(newValue)
    onValueChange?.(newValue)
  }

  if (!mounted) {
    return (
      <select 
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        disabled
      >
        <option>Loading...</option>
      </select>
    )
  }

  return (
    <select 
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      value={selectedValue}
      onChange={handleChange}
      disabled={disabled}
    >
      {children}
    </select>
  )
}

export function SafeSelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>
}

// Export the safe components with the same names for easy replacement
export const Select = SafeSelect
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectItem = SafeSelectItem
export const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder}</option>