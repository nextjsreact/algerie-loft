"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

/**
 * Responsive table wrapper that converts to cards on mobile
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

interface MobileCardListProps {
  items: any[]
  renderCard: (item: any, index: number) => ReactNode
  className?: string
}

/**
 * Mobile-friendly card list for replacing tables on small screens
 */
export function MobileCardList({ items, renderCard, className }: MobileCardListProps) {
  return (
    <div className={cn("md:hidden space-y-3", className)}>
      {items.map((item, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-4">
            {renderCard(item, index)}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Responsive data display component that shows table on desktop and cards on mobile
 */
interface ResponsiveDataDisplayProps<T> {
  data: T[]
  columns: {
    key: string
    label: string
    render?: (item: T) => ReactNode
    className?: string
  }[]
  actions?: (item: T) => ReactNode
  actionsLabel?: string
  className?: string
  emptyMessage?: string
}

export function ResponsiveDataDisplay<T extends Record<string, any>>({
  data,
  columns,
  actions,
  actionsLabel = "Actions",
  className,
  emptyMessage = "No data available"
}: ResponsiveDataDisplayProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "text-left p-3 font-medium text-gray-900 dark:text-gray-100",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
              {actions && (
                <th className="text-right p-3 font-medium text-gray-900 dark:text-gray-100">
                  {actionsLabel}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("p-3 text-gray-700 dark:text-gray-300", column.className)}
                  >
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="p-3 text-right">
                    {actions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="p-4 space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {column.label}:
                  </span>
                  <span className="text-sm text-gray-900 dark:text-gray-100 text-right flex-1 ml-2">
                    {column.render ? column.render(item) : item[column.key]}
                  </span>
                </div>
              ))}
              {actions && (
                <div className="pt-2 border-t flex justify-end">
                  {actions(item)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}