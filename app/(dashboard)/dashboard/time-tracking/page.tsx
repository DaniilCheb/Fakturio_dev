'use client'

import { useTimeEntries, useRunningTimer, useProjects } from "@/lib/hooks/queries"
import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { useSession } from "@clerk/nextjs"
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { useQueryClient } from "@tanstack/react-query"
import { 
  startTimerWithClient, 
  stopTimerWithClient,
  createTimeEntryWithClient, 
  updateTimeEntryWithClient,
  deleteTimeEntryWithClient,
  type CreateTimeEntryInput 
} from "@/lib/services/timeEntryService.client"
import Header from "@/app/components/Header"
import { Card, CardContent } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Button } from "@/app/components/ui/button"
import ActiveTimerBanner from "./components/ActiveTimerBanner"
import StartTimerModal from "./components/StartTimerModal"
import ManualEntryModal from "./components/ManualEntryModal"
import { formatDateISO } from "@/lib/utils/dateUtils"
import type { TimeEntry } from "@/lib/services/timeEntryService.client"
import type { View } from 'react-big-calendar'
import type { BigCalendarEvent } from "@/app/components/ui/big-calendar"

// Dynamically import BigCalendar to reduce initial bundle size
const BigCalendar = dynamic(
  () => import("@/app/components/ui/big-calendar").then((mod) => ({ default: mod.BigCalendar })),
  {
    loading: () => (
      <Card className="h-[600px]">
        <CardContent className="h-full flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
)

// Calendar event type
interface CalendarEvent extends BigCalendarEvent {
  resource?: {
    entry: TimeEntry
    projectName: string
    duration: string
    isRunning: boolean
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

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

export default function TimeTrackingPage() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const { data: timeEntries = [], isLoading: isLoadingEntries } = useTimeEntries()
  const { data: runningTimer } = useRunningTimer()
  const { data: projects = [] } = useProjects()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>('week')
  const [showStartTimerModal, setShowStartTimerModal] = useState(false)
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    hours: string
    minutes: string
    startTime: string  // ISO timestamp
    endTime: string    // ISO timestamp
  } | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Transform time entries to calendar events
  const events = useMemo(() => {
    return timeEntries.map((entry): CalendarEvent => {
      const project = projects.find(p => p.id === entry.project_id)
      const projectName = project?.name || 'Unknown Project'
      
      // Determine start and end times
      const startDate = new Date(entry.date)
      const endDate = new Date(entry.date)
      
      if (entry.start_time) {
        // Entry has a start time (timer-based)
        const start = new Date(entry.start_time)
        startDate.setHours(start.getHours(), start.getMinutes(), 0, 0)
        
        if (entry.end_time) {
          // Entry has an end time (completed timer)
          const end = new Date(entry.end_time)
          endDate.setHours(end.getHours(), end.getMinutes(), 0, 0)
        } else if (entry.is_running) {
          // Running timer - show current time as end
          const now = new Date()
          endDate.setHours(now.getHours(), now.getMinutes(), 0, 0)
        } else {
          // Manual entry with start time but no end time
          endDate.setHours(startDate.getHours(), startDate.getMinutes() + entry.duration_minutes, 0, 0)
        }
      } else {
        // Manual entry without start time - show as morning block
        startDate.setHours(9, 0, 0, 0)
        const endMinutes = Math.min(entry.duration_minutes, 480) // Cap at 8 hours
        endDate.setHours(9, endMinutes, 0, 0)
      }
      
      // Ensure end is after start
      if (endDate <= startDate) {
        endDate.setHours(startDate.getHours(), startDate.getMinutes() + Math.max(entry.duration_minutes, 30), 0, 0)
      }
      
      // Title: description or project name
      const title = entry.description || projectName
      
      return {
        id: entry.id,
        title: `${title} (${formatDuration(entry.duration_minutes)})`,
        start: startDate,
        end: endDate,
        resource: {
          entry,
          projectName,
          duration: formatDuration(entry.duration_minutes),
          isRunning: entry.is_running || false,
        },
      }
    })
  }, [timeEntries, projects])

  // Custom event style
  const eventStyleGetter = (event: BigCalendarEvent) => {
    // Narrow to CalendarEvent to access the specific resource type
    const calendarEvent = event as CalendarEvent
    const isRunning = calendarEvent.resource?.isRunning
    return {
      style: {
        backgroundColor: isRunning ? '#22c55e' : '#3b82f6',
        borderColor: isRunning ? '#16a34a' : '#2563eb',
        borderWidth: isRunning ? '2px' : '1px',
        borderRadius: '6px',
        // Don't set opacity here - let CSS handle it for drag states
        // opacity: isRunning ? 0.9 : 1,
        color: 'white',
        fontSize: '12px',
        padding: '2px 4px',
      },
    }
  }

  // Handle slot selection (click and drag)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Calculate duration in minutes
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.round(durationMs / (1000 * 60))
    
    // Ensure minimum duration of 15 minutes
    const minDuration = Math.max(durationMinutes, 15)
    
    // Calculate hours and minutes
    const hours = Math.floor(minDuration / 60)
    const minutes = minDuration % 60
    
    // Format date
    const date = formatDateISO(start)
    
    // Calculate adjusted end time if duration was extended to minimum
    const adjustedEnd = durationMinutes < 15 
      ? new Date(start.getTime() + 15 * 60 * 1000)
      : end
    
    // Set selected slot data and open modal (capture start/end times for proper positioning)
    setSelectedSlot({
      date,
      hours: hours.toString(),
      minutes: minutes.toString(),
      startTime: start.toISOString(),
      endTime: adjustedEnd.toISOString(),
    })
    setShowManualEntryModal(true)
  }

  // Handle event selection (click on time entry)
  const handleSelectEvent = (event: CalendarEvent) => {
    const entry = event.resource?.entry
    if (entry) {
      setSelectedEntry(entry)
      setShowEditModal(true)
    }
  }

  // Handle event drop (drag to new time)
  const handleEventDrop = async ({ event, start, end, allDay }: { event: CalendarEvent; start: Date; end: Date; allDay?: boolean }) => {
    if (!session) return
    
    const entry = event.resource?.entry
    if (!entry) return

    // Don't allow dragging running timers
    if (entry.is_running) {
      alert('Cannot move a running timer. Please stop it first.')
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      
      // Calculate new duration in minutes
      const durationMs = end.getTime() - start.getTime()
      const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)))
      
      // Format new date
      const newDate = formatDateISO(start)
      
      // Format start and end times as ISO timestamps
      const startTime = start.toISOString()
      const endTime = end.toISOString()
      
      // Update the time entry
      await updateTimeEntryWithClient(supabase, session.user.id, entry.id, {
        date: newDate,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
      })
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    } catch (error) {
      console.error('Error updating event time:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to update event time: ${errorMessage}`)
      // Re-throw to let react-big-calendar revert the drag
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle event resize (drag to change duration)
  const handleEventResize = async ({ event, start, end, allDay }: { event: CalendarEvent; start: Date; end: Date; allDay?: boolean }) => {
    if (!session) return
    
    const entry = event.resource?.entry
    if (!entry) return

    // Don't allow resizing running timers
    if (entry.is_running) {
      alert('Cannot resize a running timer. Please stop it first.')
      return
    }

    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      
      // Calculate new duration in minutes
      const durationMs = end.getTime() - start.getTime()
      const durationMinutes = Math.max(1, Math.round(durationMs / (1000 * 60)))
      
      // Format start and end times as ISO timestamps
      const startTime = start.toISOString()
      const endTime = end.toISOString()
      
      // Update the time entry
      await updateTimeEntryWithClient(supabase, session.user.id, entry.id, {
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
      })
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
    } catch (error) {
      console.error('Error resizing event:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to resize event: ${errorMessage}`)
      // Re-throw to let react-big-calendar revert the resize
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // Determine if an event is draggable (not running)
  const isEventDraggable = (event: BigCalendarEvent) => {
    // Narrow to CalendarEvent to access the specific resource type
    const calendarEvent = event as CalendarEvent
    return !calendarEvent.resource?.isRunning
  }

  // Handle timer start
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
        date: date || formatDateISO(new Date()),
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

  // Handle timer stop
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

  // Handle entry creation
  const handleCreateManualEntry = async (input: CreateTimeEntryInput) => {
    if (!session) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await createTimeEntryWithClient(supabase, session.user.id, input)
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setShowManualEntryModal(false)
      setSelectedSlot(null)
    } catch (error) {
      console.error('Error creating entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle entry update
  const handleUpdateEntry = async (entryId: string, input: CreateTimeEntryInput) => {
    if (!session) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await updateTimeEntryWithClient(supabase, session.user.id, entryId, input)
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setShowEditModal(false)
      setSelectedEntry(null)
    } catch (error) {
      console.error('Error updating entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(errorMessage)
      throw error // Re-throw to let modal handle it
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle entry deletion
  const handleDeleteEntry = async (entryId: string) => {
    if (!session) return
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await deleteTimeEntryWithClient(supabase, session.user.id, entryId)
      
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      setShowEditModal(false)
      setSelectedEntry(null)
    } catch (error) {
      console.error('Error deleting entry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(errorMessage)
      throw error // Re-throw to let modal handle it
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoadingEntries) {
    return (
      <div className="max-w-[920px] mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[700px] w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[920px] mx-auto space-y-8">
      <Header 
        title="Time Tracking" 
        actions={
          <Button
            variant="default"
            onClick={() => setShowStartTimerModal(true)}
          >
            <PlayIcon className="mr-2 h-4 w-4" />
            Start Timer
          </Button>
        }
      />

      {/* Active Timer Banner */}
      {runningTimer && (
        <ActiveTimerBanner 
          timer={runningTimer}
          onStop={handleStopTimer}
          isProcessing={isProcessing}
        />
      )}

      <Card>
        <CardContent className="p-6">
          <BigCalendar
            events={events}
            view={view}
            onView={setView}
            date={currentDate}
            onNavigate={setCurrentDate}
            eventPropGetter={eventStyleGetter}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            draggableAccessor={isEventDraggable}
            resizableAccessor={isEventDraggable}
            height={700}
          />
        </CardContent>
      </Card>

      {/* Start Timer Modal */}
      {showStartTimerModal && (
        <StartTimerModal
          projects={projects}
          onStart={handleStartTimer}
          onClose={() => setShowStartTimerModal(false)}
          isProcessing={isProcessing}
          selectedDay={formatDateISO(new Date())}
        />
      )}

      {/* Manual Entry Modal (Create Mode) */}
      {showManualEntryModal && selectedSlot && !showEditModal && (
        <ManualEntryModal
          projects={projects}
          onCreate={handleCreateManualEntry}
          onClose={() => {
            setShowManualEntryModal(false)
            setSelectedSlot(null)
          }}
          isProcessing={isProcessing}
          selectedDay={selectedSlot.date}
          prefillHours={selectedSlot.hours}
          prefillMinutes={selectedSlot.minutes}
          prefillStartTime={selectedSlot.startTime}
          prefillEndTime={selectedSlot.endTime}
        />
      )}

      {/* Edit Entry Modal */}
      {showEditModal && selectedEntry && (
        <ManualEntryModal
          projects={projects}
          onCreate={handleCreateManualEntry}
          onUpdate={handleUpdateEntry}
          onDelete={handleDeleteEntry}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEntry(null)
          }}
          isProcessing={isProcessing}
          entry={selectedEntry}
        />
      )}
    </div>
  )
}
