'use client'

import { Card, CardContent } from '@/app/components/ui/card'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Button } from '@/app/components/ui/button'
import type { TimeEntry } from '@/lib/services/timeEntryService.client'
import type { Project } from '@/lib/services/projectService.client'
import { formatDate } from '@/lib/utils/dateUtils'
import { MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'

interface TimeEntryListProps {
  entriesByDate: [string, TimeEntry[]][]
  projects: Project[]
  selectedEntries: Set<string>
  onToggleSelection: (entryId: string) => void
  onDelete: (entryId: string) => void
  formatDuration: (minutes: number) => string
  formatCurrency: (amount: number, currency?: string) => string
  selectedDay?: string | null
}

export default function TimeEntryList({
  entriesByDate,
  projects,
  selectedEntries,
  onToggleSelection,
  onDelete,
  formatDuration,
  formatCurrency,
  selectedDay,
}: TimeEntryListProps) {
  const getProjectName = (projectId: string): string => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const getProjectRate = (projectId: string): number => {
    return projects.find(p => p.id === projectId)?.hourly_rate || 0
  }

  const calculateAmount = (entry: TimeEntry): number => {
    const hours = entry.duration_minutes / 60
    return hours * entry.hourly_rate
  }

  if (entriesByDate.length === 0) {
    const emptyMessage = selectedDay 
      ? `No time entries for ${formatDate(selectedDay)}. Start tracking your time!`
      : "No time entries for this week. Start tracking your time!"
    
    return (
      <div className="p-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {entriesByDate.map(([dateKey, entries]) => {
        const date = new Date(dateKey)
        const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
        const isSelectedDay = selectedDay === dateKey
        
        return (
          <Card key={dateKey} id={`day-${dateKey}`}>
            <CardContent className="p-0">
              {/* Hide day header when this day is selected (we show it in the main header above) */}
              {!isSelectedDay && (
                <div className="p-4 border-b bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {formatDate(dateKey)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Total: {formatDuration(totalMinutes)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show total when day is selected, but as a subtitle in the main header area */}
              {isSelectedDay && (
                <div className="p-4 border-b bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Total: {formatDuration(totalMinutes)}
                  </p>
                </div>
              )}
              
              <div className="divide-y">
                {entries.map((entry) => {
                  const amount = calculateAmount(entry)
                  const isSelected = selectedEntries.has(entry.id)
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(entry.id)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium">
                          {getProjectName(entry.project_id)}
                        </div>
                        {entry.description && (
                          <div className="text-[13px] text-muted-foreground mt-1">
                            {entry.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-[14px] font-medium">
                          {formatDuration(entry.duration_minutes)}
                        </div>
                        <div className="text-[14px] text-muted-foreground">
                          {formatCurrency(amount, 'CHF')}
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onDelete(entry.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

