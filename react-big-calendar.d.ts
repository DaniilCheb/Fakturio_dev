declare module 'react-big-calendar' {
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
  
  export const Calendar: React.ComponentType<CalendarProps>
}

