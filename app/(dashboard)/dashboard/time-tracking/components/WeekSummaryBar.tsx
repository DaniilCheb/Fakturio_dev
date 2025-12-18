'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { formatDateISO } from '@/lib/utils/dateUtils'

interface WeekSummaryBarProps {
  selectedWeek: Date
  dailySummaries: Record<string, number>
  selectedDay?: string | null
  onDayClick?: (dateKey: string) => void
}

export default function WeekSummaryBar({ selectedWeek, dailySummaries, selectedDay, onDayClick }: WeekSummaryBarProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedWeek)
    date.setDate(selectedWeek.getDate() + i)
    const dateKey = formatDateISO(date)
    const minutes = dailySummaries[dateKey] || 0
    const hours = minutes / 60
    
    return {
      day: days[i],
      date: date.getDate(),
      dateKey,
      minutes,
      hours,
    }
  })

  const maxHours = Math.max(...weekDays.map(d => d.hours), 1) // Avoid division by zero

  const formatHours = (hours: number): string => {
    if (hours === 0) return '—'
    if (hours < 1) return `${Math.round(hours * 60)}m`
    return `${hours.toFixed(1)}h`
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, idx) => {
        const isSelected = selectedDay === day.dateKey
        const hasEntries = day.hours > 0
        
        return (
          <button
            key={idx}
            onClick={() => onDayClick?.(day.dateKey)}
            className={cn(
              "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              isSelected && "bg-primary/10 border-2 border-black dark:border-white",
              !isSelected && "border-2 border-transparent",
              "cursor-pointer",
              !hasEntries && "opacity-60"
            )}
          >
            <div className={cn(
              "text-xs font-medium",
              isSelected ? "text-primary font-semibold" : "text-muted-foreground"
            )}>
              {day.day}
            </div>
            <div className={cn(
              "text-sm font-semibold",
              isSelected && "text-primary"
            )}>
              {day.date}
            </div>
            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  isSelected ? "bg-primary" : "bg-primary/60"
                )}
                style={{ width: `${(day.hours / maxHours) * 100}%` }}
              />
            </div>
            <div className={cn(
              "text-xs",
              isSelected ? "text-primary font-medium" : "text-muted-foreground"
            )}>
              {formatHours(day.hours)}
            </div>
            {isSelected && (
              <div className="mt-1 flex items-center justify-center">
                <Check className="h-5 w-5 text-primary" strokeWidth={3} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

