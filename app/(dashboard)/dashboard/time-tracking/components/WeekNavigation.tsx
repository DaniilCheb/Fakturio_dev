'use client'

import { Button } from '@/app/components/ui/button'

interface WeekNavigationProps {
  selectedWeek: Date
  onWeekChange: (date: Date) => void
}

export default function WeekNavigation({ selectedWeek, onWeekChange }: WeekNavigationProps) {
  const goToPreviousWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() - 7)
    onWeekChange(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(selectedWeek)
    newDate.setDate(selectedWeek.getDate() + 7)
    onWeekChange(newDate)
  }

  const goToCurrentWeek = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
    startOfWeek.setHours(0, 0, 0, 0)
    onWeekChange(startOfWeek)
  }

  const formatWeekRange = (date: Date): string => {
    const end = new Date(date)
    end.setDate(date.getDate() + 6)
    
    const startStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    return `${startStr} - ${endStr}`
  }

  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
        ◀ Week
      </Button>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formatWeekRange(selectedWeek)}</span>
        <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
          Today
        </Button>
      </div>
      
      <Button variant="outline" size="sm" onClick={goToNextWeek}>
        Week ▶
      </Button>
    </div>
  )
}

