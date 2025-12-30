'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'json'
export type ExportType = 'lofts' | 'transactions' | 'tasks' | 'reports' | 'all'

interface ExportOption {
  key: string
  label: string
  description: string
  icon: React.ReactNode
}

interface DataExportProps {
  onExport: (config: ExportConfig) => Promise<void>
  availableTypes?: ExportType[]
  className?: string
}

export interface ExportConfig {
  type: ExportType
  format: ExportFormat
  dateRange?: DateRange
  includeFields?: string[]
  filters?: Record<string, any>
}

const exportOptions: Record<ExportType, ExportOption> = {
  lofts: {
    key: 'lofts',
    label: 'Lofts Data',
    description: 'Export all loft properties and their details',
    icon: <FileText className="h-4 w-4" />
  },
  transactions: {
    key: 'transactions',
    label: 'Financial Transactions',
    description: 'Export income and expense records',
    icon: <FileSpreadsheet className="h-4 w-4" />
  },
  tasks: {
    key: 'tasks',
    label: 'Tasks & Maintenance',
    description: 'Export task assignments and maintenance records',
    icon: <Calendar className="h-4 w-4" />
  },
  reports: {
    key: 'reports',
    label: 'Analytics Reports',
    description: 'Export compiled reports and analytics',
    icon: <FileSpreadsheet className="h-4 w-4" />
  },
  all: {
    key: 'all',
    label: 'Complete Export',
    description: 'Export all data in a comprehensive package',
    icon: <Download className="h-4 w-4" />
  }
}

const formatOptions = [
  { value: 'csv', label: 'CSV (Comma Separated)', description: 'Best for spreadsheet applications' },
  { value: 'xlsx', label: 'Excel Workbook', description: 'Native Excel format with formatting' },
  { value: 'pdf', label: 'PDF Report', description: 'Formatted report for sharing' },
  { value: 'json', label: 'JSON Data', description: 'Raw data for developers' }
]

export function DataExport({ onExport, availableTypes = ['lofts', 'transactions', 'tasks', 'reports'], className }: DataExportProps) {
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [config, setConfig] = useState<Partial<ExportConfig>>({
    format: 'csv'
  })

  const handleExport = async () => {
    if (!config.type || !config.format) {
      toast.error('Please select export type and format')
      return
    }

    setIsExporting(true)
    try {
      await onExport(config as ExportConfig)
      toast.success('Export completed successfully')
      setIsOpen(false)
      setConfig({ format: 'csv' })
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          {availableTypes.slice(0, 3).map((type) => {
            const option = exportOptions[type]
            return (
              <DropdownMenuItem
                key={type}
                onClick={() => {
                  setConfig({ type, format: 'csv' })
                  onExport({ type, format: 'csv' })
                }}
                className="gap-2"
              >
                {option.icon}
                {option.label}
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsOpen(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Advanced Export...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Configure your data export settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Export Type Selection */}
            <div className="space-y-2">
              <Label>What to export</Label>
              <Select
                value={config.type}
                onValueChange={(value: ExportType) => setConfig({ ...config, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((type) => {
                    const option = exportOptions[type]
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export format</Label>
              <Select
                value={config.format}
                onValueChange={(value: ExportFormat) => setConfig({ ...config, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-muted-foreground">{format.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range (for time-based data) */}
            {(config.type === 'transactions' || config.type === 'tasks' || config.type === 'reports') && (
              <div className="space-y-2">
                <Label>Date range (optional)</Label>
                <DatePickerWithRange
                  value={config.dateRange}
                  onChange={(dateRange) => setConfig({ ...config, dateRange })}
                />
              </div>
            )}

            {/* Additional Options */}
            <div className="space-y-3">
              <Label>Additional options</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-archived" />
                  <Label htmlFor="include-archived" className="text-sm">
                    Include archived items
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include-metadata" />
                  <Label htmlFor="include-metadata" className="text-sm">
                    Include metadata and timestamps
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting || !config.type}>
              {isExporting ? 'Exporting...' : 'Export Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Utility functions for export functionality
export async function exportToCSV(data: any[], filename: string) {
  if (!data.length) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function exportToJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}