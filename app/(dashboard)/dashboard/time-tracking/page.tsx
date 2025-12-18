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
import { formatDate } from "@/lib/utils/dateUtils"
import { useRouter } from "next/navigation"
import { Play, Plus } from "lucide-react"

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
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
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

  const handleStartTimer = async (projectId: string, description?: string) => {
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
      <div className="max-w-[800px] mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8 space-y-6">
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
            <div className="pb-4 border-b-2 border-primary/20">
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                {formatDate(selectedDay)}
              </h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Creating entries for this day
                </p>
                {selectedDaySummary && selectedDaySummary.totalMinutes > 0 && (
                  <p className="text-sm font-semibold text-foreground">
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
          <div className="pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowStartTimerModal(true)}
                className="flex-1 sm:flex-none min-w-[200px]"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Timer
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowManualEntryModal(true)}
                className="flex-1 sm:flex-none min-w-[200px]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Manual Entry
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
        />
      )}

      {showManualEntryModal && (
        <ManualEntryModal
          projects={projects}
          onCreate={handleCreateManualEntry}
          onClose={() => setShowManualEntryModal(false)}
          isProcessing={isProcessing}
        />
      )}
    </div>
  )
}

