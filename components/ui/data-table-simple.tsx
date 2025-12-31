"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: any[]
  data: TData[]
  searchPlaceholder?: string
  searchKeys?: (keyof TData)[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKeys = [],
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("")

  // Simple filtering logic
  const filteredData = data.filter((item: any) => {
    if (!globalFilter) return true
    
    const searchValue = globalFilter.toLowerCase()
    
    if (searchKeys.length > 0) {
      return searchKeys.some(key => {
        const value = item[key]
        return value && value.toString().toLowerCase().includes(searchValue)
      })
    }
    
    // Search in all string values
    return Object.values(item).some(value => 
      value && value.toString().toLowerCase().includes(searchValue)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="pl-8"
        />
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  {typeof column.header === 'function' 
                    ? column.header({ column: { id: column.id || `col-${index}` } })
                    : column.header || column.accessorKey || `Column ${index + 1}`
                  }
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((row: any, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {typeof column.cell === 'function'
                        ? column.cell({ 
                            row: { 
                              original: row,
                              getValue: (key: string) => row[key]
                            }, 
                            getValue: () => column.accessorKey ? row[column.accessorKey] : ''
                          })
                        : column.accessorKey 
                          ? row[column.accessorKey] 
                          : ''
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}