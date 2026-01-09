'use client'

import * as React from 'react'
import {
  Calendar as ReactBigCalendar,
  dateFnsLocalizer,
  type View,
  type ToolbarProps,
  type EventProps,
} from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

// View options for segmented control
const VIEW_OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
] as const

// Setup the localizer with date-fns
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Wrap Calendar with drag and drop functionality
const DragAndDropCalendar = withDragAndDrop(ReactBigCalendar)

// Custom Toolbar Component using shadcn components
function CustomToolbar<TEvent extends object>({
  date,
  view,
  onNavigate,
  onView,
  label,
}: ToolbarProps<TEvent, object>) {
  const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    if (action === 'TODAY') {
      onNavigate('TODAY')
      return
    }

    let newDate: Date
    if (view === 'month') {
      newDate = action === 'PREV' ? subMonths(date, 1) : addMonths(date, 1)
    } else if (view === 'week') {
      newDate = action === 'PREV' ? subWeeks(date, 1) : addWeeks(date, 1)
    } else {
      newDate = action === 'PREV' ? subDays(date, 1) : addDays(date, 1)
    }
    onNavigate('DATE', newDate)
  }

  return (
    <div className="flex items-center justify-between gap-4 mb-4 pb-4">
      {/* Left: Today button, arrows, and date - all stacked on left */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleNavigate('TODAY')}
          className="font-medium bg-transparent hover:bg-accent"
        >
          Today
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('PREV')}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-base font-semibold">
          {label}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('NEXT')}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: View switcher - Segmented Control */}
      <div className="flex items-center bg-[#F0F0F0] dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] rounded-lg p-1 h-[40px]">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onView(option.value as View)}
            className={cn(
              "px-4 h-full rounded-md text-[14px] font-medium transition-all",
              view === option.value
                ? 'bg-white dark:bg-[#333] text-[#141414] dark:text-white shadow-sm border border-[#e0e0e0] dark:border-[#444]'
                : 'text-[#666666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Custom Event Component
function CustomEvent<TEvent extends { title?: string; resource?: { isRunning?: boolean } }>({
  event,
}: EventProps<TEvent>) {
  const isRunning = event.resource?.isRunning
  
  return (
    <div
      className={cn(
        "px-2 py-1 text-xs font-medium truncate rounded",
        isRunning && "animate-pulse"
      )}
    >
      {event.title}
    </div>
  )
}

// BigCalendar Props
export interface BigCalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource?: {
    isRunning?: boolean
    [key: string]: unknown
  }
}

export interface BigCalendarProps<TEvent extends BigCalendarEvent = BigCalendarEvent> {
  events: TEvent[]
  defaultView?: View
  view?: View
  onView?: (view: View) => void
  date?: Date
  onNavigate?: (date: Date) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date; slots: Date[] }) => void
  onSelectEvent?: (event: TEvent) => void
  onEventDrop?: (args: { event: TEvent; start: Date; end: Date; allDay?: boolean }) => void | Promise<void>
  onEventResize?: (args: { event: TEvent; start: Date; end: Date; allDay?: boolean }) => void | Promise<void>
  draggableAccessor?: (event: TEvent) => boolean
  resizableAccessor?: (event: TEvent) => boolean
  eventPropGetter?: (event: TEvent) => { style?: React.CSSProperties; className?: string }
  className?: string
  height?: number | string
  selectable?: boolean
  step?: number
  timeslots?: number
  min?: Date
  max?: Date
  showMultiDayTimes?: boolean
  popup?: boolean
}

export function BigCalendar<TEvent extends BigCalendarEvent = BigCalendarEvent>({
  events,
  defaultView = 'week',
  view: controlledView,
  onView,
  date: controlledDate,
  onNavigate,
  onSelectSlot,
  onSelectEvent,
  onEventDrop,
  onEventResize,
  draggableAccessor,
  resizableAccessor,
  eventPropGetter,
  className,
  height = 700,
  selectable = true,
  step = 30,
  timeslots = 2,
  min,
  max,
  showMultiDayTimes = true,
  popup = true,
}: BigCalendarProps<TEvent>) {
  const [internalView, setInternalView] = React.useState<View>(defaultView)
  const [internalDate, setInternalDate] = React.useState(new Date())

  const currentView = controlledView ?? internalView
  const currentDate = controlledDate ?? internalDate

  const handleViewChange = (newView: View) => {
    if (onView) {
      onView(newView)
    } else {
      setInternalView(newView)
    }
  }

  const handleNavigate = (newDate: Date) => {
    if (onNavigate) {
      onNavigate(newDate)
    } else {
      setInternalDate(newDate)
    }
  }

  // Default event style getter
  const defaultEventPropGetter = (event: TEvent) => {
    const isRunning = event.resource?.isRunning
    return {
      style: {
        backgroundColor: isRunning ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))',
        borderColor: isRunning ? 'hsl(var(--chart-2))' : 'hsl(var(--primary))',
        borderWidth: '1px',
        borderRadius: '6px',
        color: 'hsl(var(--primary-foreground))',
        fontSize: '12px',
        padding: '2px 4px',
      },
    }
  }

  // Wrap callbacks to handle type compatibility with react-big-calendar
  const handleSelectEvent = onSelectEvent
    ? (event: object) => onSelectEvent(event as TEvent)
    : undefined

  const handleEventDrop = onEventDrop
    ? (args: { event: object; start: string | Date; end: string | Date; allDay?: boolean }) =>
        onEventDrop({ event: args.event as TEvent, start: new Date(args.start), end: new Date(args.end), allDay: args.allDay })
    : undefined

  const handleEventResize = onEventResize
    ? (args: { event: object; start: string | Date; end: string | Date; allDay?: boolean }) =>
        onEventResize({ event: args.event as TEvent, start: new Date(args.start), end: new Date(args.end), allDay: args.allDay })
    : undefined

  return (
    <div className={cn("big-calendar-wrapper", className)} style={{ height }}>
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={currentView}
        onView={handleViewChange}
        date={currentDate}
        onNavigate={handleNavigate}
        eventPropGetter={eventPropGetter ?? defaultEventPropGetter}
        selectable={selectable}
        onSelectSlot={onSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        draggableAccessor={draggableAccessor ?? (() => true)}
        resizableAccessor={resizableAccessor ?? (() => true)}
        step={step}
        timeslots={timeslots}
        min={min ?? new Date(2024, 0, 1, 0, 0)}
        max={max ?? new Date(2024, 0, 1, 23, 59)}
        showMultiDayTimes={showMultiDayTimes}
        popup={popup}
        views={['month', 'week', 'day']}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
        }}
        formats={{
          dayHeaderFormat: (date: Date) => format(date, 'EEE M/d'),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
          monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy'),
          timeGutterFormat: (date: Date) => format(date, 'h a'),
        }}
      />
    </div>
  )
}

export { localizer }

