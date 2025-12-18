'use client'

import { useTimeEntries, useRunningTimer, useProjects } from "@/lib/hooks/queries"
import { useState, useMemo, useEffect } from "react"
import { useSession } from "@clerk/nextjs"
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { useQueryClient } from "@tanstack/react-query"
import { 
  startTimerWithClient, 
  stopTimerWithClient, 
  createTimeEntryWithClient,
  deleteTimeEntryWithClient,
  updateTimeEntryWithClient,
  markEntriesAsInvoicedWithClient,
  calculateTimeEntrySummary,
  type TimeEntry,
  type CreateTimeEntryInput
} from "@/lib/services/timeEntryService.client"
import Header from "@/app/components/Header"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Skeleton } from "@/app/components/ui/skeleton"
import ActiveTimerBanner from "./components/ActiveTimerBanner"
import WeekNavigation from "./components/WeekNavigation"
import WeekSummaryBar from "./components/WeekSummaryBar"
import TimeEntryList from "./components/TimeEntryList"
import StartTimerModal from "./components/StartTimerModal"
import ManualEntryModal from "./components/ManualEntryModal"
import SelectionFooter from "./components/SelectionFooter"
import { formatCurrency } from "@/lib/utils/formatters"
import { formatDate, getCurrentDateISO } from "@/lib/utils/dateUtils"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

// Play icon component
const PlayIcon = ({ className }: { className?: string }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M6.235 2.19193C6.00679 2.06365 5.74898 1.99733 5.4872 1.99957C5.22542 2.0018 4.96878 2.07251 4.74279 2.20466C4.5168 2.33682 4.32934 2.52582 4.19903 2.75287C4.06872 2.97993 4.0001 3.23714 4 3.49893V12.4989C3.99993 12.7608 4.06842 13.0181 4.19865 13.2453C4.32889 13.4725 4.51634 13.6617 4.74236 13.7939C4.96837 13.9262 5.22508 13.997 5.48695 13.9993C5.74882 14.0016 6.00672 13.9352 6.235 13.8069L14.235 9.30693C14.467 9.17646 14.6602 8.98659 14.7946 8.75682C14.929 8.52704 14.9999 8.26563 14.9999 7.99943C14.9999 7.73322 14.929 7.47182 14.7946 7.24204C14.6602 7.01226 14.467 6.82239 14.235 6.69193L6.235 2.19193Z" 
      fill="currentColor"
    />
  </svg>
)

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function TimeTrackingPage() {
  const { session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: timeEntries = [], isLoading: isLoadingEntries } = useTimeEntries()
  const { data: runningTimer } = useRunningTimer()
  const { data: projects = [] } = useProjects()
  
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
    startOfWeek.setHours(0, 0, 0, 0)
    return startOfWeek
  })
  
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [selectedDay, setSelectedDay] = useState<string | null>(() => getCurrentDateISO())
  const [showStartTimerModal, setShowStartTimerModal] = useState(false)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Calculate week range
  const weekEnd = useMemo(() => {
    const end = new Date(selectedWeek)
    end.setDate(selectedWeek.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return end
  }, [selectedWeek])

  // Filter entries for current week
  const weekEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.date)
      return entryDate >= selectedWeek && entryDate <= weekEnd
    })
  }, [timeEntries, selectedWeek, weekEnd])

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, TimeEntry[]> = {}
    weekEntries.forEach(entry => {
      const dateKey = entry.date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(entry)
    })
    // Sort dates descending
    return Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
  }, [weekEntries])

  // Filter entries by selected day if a day is selected
  const filteredEntriesByDate = useMemo(() => {
    if (!selectedDay) {
      return entriesByDate
    }
    // Filter to show only the selected day
    return entriesByDate.filter(([dateKey]) => dateKey === selectedDay)
  }, [entriesByDate, selectedDay])

  // Calculate week summary
  const weekSummary = useMemo(() => {
    const totalMinutes = weekEntries.reduce((sum, e) => sum + e.duration_minutes, 0)
    const totalAmount = weekEntries.reduce((sum, e) => {
      const hours = e.duration_minutes / 60
      return sum + (hours * e.hourly_rate)
    }, 0)
    
    return {
      totalMinutes,
      totalHours: totalMinutes / 60,
      totalAmount,
    }
  }, [weekEntries])

  // Calculate daily summaries for week summary bar
  const dailySummaries = useMemo(() => {
    const summaries: Record<string, number> = {}
    weekEntries.forEach(entry => {
      const dateKey = entry.date
      summaries[dateKey] = (summaries[dateKey] || 0) + entry.duration_minutes
    })
    return summaries
  }, [weekEntries])

  const handleStartTimer = async (projectId: string, description?: string, date?: string) => {
    if (!session) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      const project = projects.find(p => p.id === projectId)
      if (!project || !project.hourly_rate) {
        alert('Project must have an hourly rate set')
        setIsProcessing(false)
        return
      }
      
      await startTimerWithClient(supabase, session.user.id, {
        project_id: projectId,
        description,
        hourly_rate: project.hourly_rate,
        date: date || selectedDay || undefined,
      })
      
      await queryClient.invalidateQueries({ queryKey: ['runningTimer'] })
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setShowStartTimerModal(false)
    } catch (error) {
      console.error('Error starting timer:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStopTimer = async () => {
    if (!session || !runningTimer) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await stopTimerWithClient(supabase, session.user.id, runningTimer.id)
      
      await queryClient.invalidateQueries({ queryKey: ['runningTimer'] })
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    } catch (error) {
      console.error('Error stopping timer:', error)
      alert(`Failed to stop timer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateManualEntry = async (input: CreateTimeEntryInput) => {
    if (!session) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await createTimeEntryWithClient(supabase, session.user.id, input)
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setShowManualEntryModal(false)
    } catch (error) {
      console.error('Error creating entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!session) return
    if (!confirm('Are you sure you want to delete this time entry?')) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await deleteTimeEntryWithClient(supabase, session.user.id, entryId)
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setSelectedEntries(prev => {
        const next = new Set(prev)
        next.delete(entryId)
        return next
      })
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert(`Failed to delete entry: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateInvoice = async () => {
    if (!session || selectedEntries.size === 0) return
    
    const selected = weekEntries.filter(e => selectedEntries.has(e.id))
    if (selected.length === 0) return
    
    // Group by project
    const byProject: Record<string, TimeEntry[]> = {}
    selected.forEach(entry => {
      if (!byProject[entry.project_id]) {
        byProject[entry.project_id] = []
      }
      byProject[entry.project_id].push(entry)
    })
    
    // For now, handle single project (can extend later)
    const projectIds = Object.keys(byProject)
    if (projectIds.length > 1) {
      alert('Please select entries from a single project')
      return
    }
    
    const projectId = projectIds[0]
    const entries = byProject[projectId]
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    
    const summary = calculateTimeEntrySummary(entries, project.name)
    
    // Navigate to invoice creation with pre-filled data
    const params = new URLSearchParams({
      fromTimeEntries: 'true',
      projectId: projectId,
      entryIds: entries.map(e => e.id).join(','),
      hours: summary.total_hours.toString(),
      rate: summary.hourly_rate.toString(),
      amount: summary.total_amount.toString(),
      description: `${project.name} - ${summary.total_hours} hours (${summary.date_range.from} to ${summary.date_range.to})`,
    })
    
    router.push(`/dashboard/invoices/new?${params.toString()}`)
  }

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }

  const selectedEntriesData = useMemo(() => {
    return weekEntries.filter(e => selectedEntries.has(e.id))
  }, [weekEntries, selectedEntries])

  const selectedSummary = useMemo(() => {
    const totalMinutes = selectedEntriesData.reduce((sum, e) => sum + e.duration_minutes, 0)
    const totalAmount = selectedEntriesData.reduce((sum, e) => {
      const hours = e.duration_minutes / 60
      return sum + (hours * e.hourly_rate)
    }, 0)
    
    return {
      count: selectedEntriesData.length,
      totalMinutes,
      totalHours: totalMinutes / 60,
      totalAmount,
    }
  }, [selectedEntriesData])

  // Calculate selected day summary
  const selectedDaySummary = useMemo(() => {
    if (!selectedDay) return null
    const selectedDayEntries = weekEntries.filter(e => e.date === selectedDay)
    const totalMinutes = selectedDayEntries.reduce((sum, e) => sum + e.duration_minutes, 0)
    return {
      totalMinutes,
      count: selectedDayEntries.length,
    }
  }, [selectedDay, weekEntries])

  if (isLoadingEntries) {
    return (
      <div className="max-w-[800px] mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <Header title="Time Tracking" />

      {/* Active Timer Banner */}
      {runningTimer && (
        <ActiveTimerBanner 
          timer={runningTimer}
          onStop={handleStopTimer}
          isProcessing={isProcessing}
        />
      )}

      {/* Calendar and Time Entries Container */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Week Navigation */}
          <WeekNavigation 
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />

          {/* Week Summary Bar */}
          <WeekSummaryBar 
            selectedWeek={selectedWeek}
            dailySummaries={dailySummaries}
            selectedDay={selectedDay}
            onDayClick={(dateKey) => {
              setSelectedDay(dateKey)
              // Scroll to the day's entries
              const element = document.getElementById(`day-${dateKey}`)
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }}
          />

          {/* Selected Day Header */}
          {selectedDay && (
            <div className="pb-2">
              <h2 className="text-[20px] font-bold mb-2 text-foreground">
                {formatDate(selectedDay)}
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-[15px] font-normal text-muted-foreground">
                  Creating entries for this day
                </p>
                {selectedDaySummary && selectedDaySummary.totalMinutes > 0 && (
                  <p className="text-[15px] font-semibold text-foreground">
                    Total: {formatDuration(selectedDaySummary.totalMinutes)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Time Entries List */}
          <TimeEntryList
            entriesByDate={filteredEntriesByDate}
            projects={projects}
            selectedEntries={selectedEntries}
            onToggleSelection={toggleEntrySelection}
            onDelete={handleDeleteEntry}
            formatDuration={formatDuration}
            formatCurrency={formatCurrency}
            selectedDay={selectedDay}
          />

          {/* Action Buttons */}
          <div className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowManualEntryModal(true)}
                className="flex-1 sm:flex-none"
              >
                <Plus className="mr-2 h-4 w-4" />
                Manual Entry
              </Button>
              <Button
                variant="default"
                onClick={() => setShowStartTimerModal(true)}
                className="flex-1 sm:flex-none"
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Footer */}
      {selectedEntries.size > 0 && (
        <SelectionFooter
          count={selectedSummary.count}
          totalHours={selectedSummary.totalHours}
          totalAmount={selectedSummary.totalAmount}
          onCreateInvoice={handleCreateInvoice}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Modals */}
      {showStartTimerModal && (
        <StartTimerModal
          projects={projects}
          onStart={handleStartTimer}
          onClose={() => setShowStartTimerModal(false)}
          isProcessing={isProcessing}
          selectedDay={selectedDay}
        />
      )}

      {showManualEntryModal && (
        <ManualEntryModal
          projects={projects}
          onCreate={handleCreateManualEntry}
          onClose={() => setShowManualEntryModal(false)}
          isProcessing={isProcessing}
          selectedDay={selectedDay}
        />
      )}
    </div>
  )
}

