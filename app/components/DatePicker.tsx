'use client'

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Calendar } from "@/app/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Button } from "@/app/components/ui/button"
import { Label } from "@/app/components/ui/label"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  label?: string
  value: string // ISO date string (YYYY-MM-DD)
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
  error?: string
  required?: boolean
  noLabel?: boolean
  disabled?: boolean
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  className = "",
  error,
  required,
  noLabel = false,
  disabled = false
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Parse the ISO date string to a Date object
  const date = React.useMemo(() => {
    if (!value) return undefined
    const parsed = new Date(value)
    // Check if date is valid
    return isNaN(parsed.getTime()) ? undefined : parsed
  }, [value])
  
  // Format date for display (DD.MM.YYYY format as shown in the image)
  const displayValue = date ? format(date, "dd.MM.yyyy") : ""

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Convert to ISO date string (YYYY-MM-DD)
      const isoDate = format(selectedDate, "yyyy-MM-dd")
      const syntheticEvent = {
        target: { value: isoDate }
      } as React.ChangeEvent<HTMLInputElement>
      onChange(syntheticEvent)
      setOpen(false)
    }
  }

  const datePickerElement = (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal h-auto px-2 py-2",
              !date && "text-muted-foreground",
              error && "border-destructive focus:ring-destructive",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && (
        <span className="text-destructive text-[12px] mt-1 block">
          {error || 'Required field'}
        </span>
      )}
    </>
  )

  // If noLabel is true, return date picker with optional error message below
  if (noLabel) {
    return (
      <div className="flex flex-col gap-1 w-full">
        {datePickerElement}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full", className)}>
      {label && (
        <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {datePickerElement}
    </div>
  )
}

