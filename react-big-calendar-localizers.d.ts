declare module 'react-big-calendar/lib/localizers/dateFnsLocalizer' {
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
}

