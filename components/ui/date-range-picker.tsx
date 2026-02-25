'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface DatePickerWithRangeProps {
  date?: DateRange | undefined
  onDateChange?: (date: DateRange | undefined) => void
  value?: DateRange | undefined
  onChange?: (date: DateRange | undefined) => void
  className?: string
}

export function DatePickerWithRange({
  date,
  onDateChange,
  value,
  onChange,
  className
}: DatePickerWithRangeProps) {
  // Support both prop naming conventions
  const selectedDate = value ?? date
  const handleDateChange = onChange ?? onDateChange
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {selectedDate?.from ? (
                selectedDate.to ? (
                  <>
                    {format(selectedDate.from, 'dd MMM yyyy', { locale: fr })} -{' '}
                    {format(selectedDate.to, 'dd MMM yyyy', { locale: fr })}
                  </>
                ) : (
                  format(selectedDate.from, 'dd MMM yyyy', { locale: fr })
                )
              ) : (
                'Sélectionner une période'
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={selectedDate?.from}
            selected={selectedDate}
            onSelect={handleDateChange}
            numberOfMonths={2}
            locale={fr}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}