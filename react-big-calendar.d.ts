declare module 'react-big-calendar' {
  import * as React from 'react'
  
  export type View = 'month' | 'week' | 'day' | 'agenda' | 'work_week'
  
  export interface Event {
    title?: string
    start?: Date
    end?: Date
    resource?: any
    [key: string]: any
  }
  
  export interface CalendarProps {
    events?: Event[]
    view?: View
    date?: Date
    onView?: (view: View) => void
    onNavigate?: (date: Date) => void
    onSelectEvent?: (event: Event) => void
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
    [key: string]: any
  }
  
  export interface ToolbarProps<TEvent extends object = Event, TResource extends object = object> {
    date: Date
    view: View
    label: string
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', date?: Date) => void
    onView: (view: View) => void
  }
  
  export interface EventProps<TEvent extends object = Event> {
    event: TEvent
  }
  
  export interface Localizer {
    format(value: Date | Date[], formatStr: string, culture?: string): string
    startOfWeek(culture?: string): number
    startOf(date: Date, unit: string): Date
    endOf(date: Date, unit: string): Date
    [key: string]: any
  }
  
  export type DateFnsLocalizerConfig = {
    format: (date: Date, formatStr: string, options?: any) => string
    parse: (dateStr: string, formatStr: string, referenceDate: Date, options?: any) => Date
    startOfWeek: (date: Date, options?: any) => Date
    getDay: (date: Date) => number
    locales?: Record<string, any>
  }
  
  export function dateFnsLocalizer(config: DateFnsLocalizerConfig): Localizer
  
  export const Calendar: React.ComponentType<CalendarProps>
  
  // Re-export for compatibility
  export default Calendar
}

