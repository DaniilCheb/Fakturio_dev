'use client'

import { useTimeEntries, useProjects } from "@/lib/hooks/queries"
import { useState, useMemo } from "react"
import Header from "@/app/components/Header"
import { Card, CardContent } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Button } from "@/app/components/ui/button"
import { BigCalendar, type BigCalendarEvent } from "@/app/components/ui/big-calendar"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "@clerk/nextjs"
import { createClientSupabaseClient } from "@/lib/supabase-client"
import { useQueryClient } from "@tanstack/react-query"
import { 
  createTimeEntryWithClient, 
  updateTimeEntryWithClient,
  deleteTimeEntryWithClient,
  type CreateTimeEntryInput 
} from "@/lib/services/timeEntryService.client"
import { formatDateISO } from "@/lib/utils/dateUtils"
import ManualEntryModal from "../components/ManualEntryModal"
import type { TimeEntry } from "@/lib/services/timeEntryService.client"
import type { View } from 'react-big-calendar'

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

export default function CalendarPreviewPage() {
  const router = useRouter()
  const { session } = useSession()
  const queryClient = useQueryClient()
  const { data: timeEntries = [], isLoading: isLoadingEntries } = useTimeEntries()
  const { data: projects = [] } = useProjects()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>('week')
  const [showManualEntryModal, setShowManualEntryModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    hours: string
    minutes: string
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
  const eventStyleGetter = (event: CalendarEvent) => {
    const isRunning = event.resource?.isRunning
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
    
    // Set selected slot data and open modal
    setSelectedSlot({
      date,
      hours: hours.toString(),
      minutes: minutes.toString(),
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
    } finally {
      setIsProcessing(false)
    }
  }

  // Determine if an event is draggable (not running)
  const isEventDraggable = (event: CalendarEvent) => {
    return !event.resource?.isRunning
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
      <div className="max-w-[1400px] mx-auto space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[700px] w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Header title="Calendar Preview" />
      </div>

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

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Calendar Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>Month, Week, and Day views</strong> - Switch between different calendar views</li>
            <li>• <strong>Time entries displayed as events</strong> - All your time entries are shown on the calendar</li>
            <li>• <strong>Running timers highlighted</strong> - Active timers appear in green with a pulsing effect</li>
            <li>• <strong>Click and drag to create entries</strong> - Click and drag on any time slot to create a new time entry</li>
            <li>• <strong>Drag events to change time</strong> - Drag events to different time slots to update their schedule</li>
            <li>• <strong>Resize events to change duration</strong> - Drag the edges of events to adjust their duration</li>
            <li>• <strong>Event details on hover</strong> - Hover over events to see more information</li>
            <li>• <strong>Responsive design</strong> - Works on desktop and mobile devices</li>
          </ul>
        </CardContent>
      </Card>

      {/* Manual Entry Modal (Create Mode) */}
      {showManualEntryModal && selectedSlot && (
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

