'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Folder } from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { startTimerWithClient, stopTimerWithClient } from '@/lib/services/timeEntryService.client'
import { useRunningTimer, useProjects, useTimeEntries, useInvoices, useContacts } from '@/lib/hooks/queries'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Popover, PopoverTrigger, PopoverContent } from '@/app/components/ui/popover'
import { Input } from '@/app/components/ui/input'
import { formatCurrency } from '@/lib/utils/formatters'
import { ProjectsIcon } from '@/app/components/Icons'
import ListRow, { type ListRowColumn } from '@/app/components/ListRow'
import type { Project } from '@/lib/services/projectService.client'
import type { TimeEntry } from '@/lib/services/timeEntryService.client'

interface ProjectWithStats extends Project {
  timeTracked: number // in minutes
  billed: number // in minutes
  billedAmount: number // in currency
  customerName: string
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Filled play icon matching Figma design
function PlayIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 13 13" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4.70735 1.5701C3.85585 1.07238 2.78613 1.68617 2.78613 2.67231V10.3279C2.78613 11.3136 3.85585 11.9274 4.70735 11.4301L11.531 7.44192C12.2515 7.02081 12.2515 5.97942 11.531 5.55831L4.70735 1.5701Z" fill="currentColor"/>
    </svg>
  )
}

// Filled pause icon from fluent design
function PauseIcon({ size = 12, className }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.75 3C6.02065 3 5.32118 3.28973 4.80546 3.80546C4.28973 4.32118 4 5.02065 4 5.75V22.25C4 22.9793 4.28973 23.6788 4.80546 24.1945C5.32118 24.7103 6.02065 25 6.75 25H9.75C10.1111 25 10.4687 24.9289 10.8024 24.7907C11.136 24.6525 11.4392 24.4499 11.6945 24.1945C11.9499 23.9392 12.1525 23.636 12.2907 23.3024C12.4289 22.9687 12.5 22.6111 12.5 22.25V5.75C12.5 5.38886 12.4289 5.03127 12.2907 4.69762C12.1525 4.36398 11.9499 4.06082 11.6945 3.80546C11.4392 3.5501 11.136 3.34753 10.8024 3.20933C10.4687 3.07113 10.1111 3 9.75 3H6.75ZM18.25 3C17.5207 3 16.8212 3.28973 16.3055 3.80546C15.7897 4.32118 15.5 5.02065 15.5 5.75V22.25C15.5 22.9793 15.7897 23.6788 16.3055 24.1945C16.8212 24.7103 17.5207 25 18.25 25H21.25C21.9793 25 22.6788 24.7103 23.1945 24.1945C23.7103 23.6788 24 22.9793 24 22.25V5.75C24 5.02065 23.7103 4.32118 23.1945 3.80546C22.6788 3.28973 21.9793 3 21.25 3H18.25Z" fill="currentColor"/>
    </svg>
  )
}

function ProjectRow({ 
  project, 
  runningTimer,
  onStartTimer,
  onStopTimer,
  isProcessing
}: { 
  project: ProjectWithStats
  runningTimer: TimeEntry | null
  onStartTimer: (projectId: string, description?: string) => void
  onStopTimer: () => void
  isProcessing: boolean
}) {
  const router = useRouter()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [showPopover, setShowPopover] = useState(false)
  const [description, setDescription] = useState('')
  const isTimerRunning = runningTimer?.project_id === project.id

  useEffect(() => {
    if (!isTimerRunning || !runningTimer?.start_time) {
      setElapsedSeconds(0)
      return
    }
    
    const startTime = new Date(runningTimer.start_time).getTime()
    
    const updateElapsed = () => {
      const now = Date.now()
      const elapsed = Math.floor((now - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }
    
    updateElapsed()
    const interval = setInterval(updateElapsed, 1000)
    
    return () => clearInterval(interval)
  }, [isTimerRunning, runningTimer?.start_time])

  // Calculate real-time time tracked (including running timer) - updates every second
  const realTimeTrackedMinutes = useMemo(() => {
    if (!isTimerRunning) {
      return project.timeTracked
    }
    // Add elapsed seconds from the running timer, convert to minutes (with decimals for smooth updates)
    const elapsedMinutes = elapsedSeconds / 60
    return project.timeTracked + elapsedMinutes
  }, [isTimerRunning, project.timeTracked, elapsedSeconds])
  
  // Calculate real-time money value - updates every second
  const realTimeMoney = useMemo(() => {
    if (!project.hourly_rate) {
      return 0
    }
    // Calculate based on real-time tracked minutes (convert to hours)
    const hours = realTimeTrackedMinutes / 60
    return hours * project.hourly_rate
  }, [project.hourly_rate, realTimeTrackedMinutes])

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the timer button
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/dashboard/projects/${project.id}`)
  }

  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isTimerRunning) {
      onStopTimer()
    } else {
      setShowPopover(true)
    }
  }

  const handleStartWithDescription = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const desc = description.trim() || undefined
    onStartTimer(project.id, desc)
    setShowPopover(false)
    setDescription('')
  }

  const handlePopoverOpenChange = (open: boolean) => {
    setShowPopover(open)
    if (!open) {
      setDescription('')
    }
  }

  const timerButton = isTimerRunning ? (
    <button
      onClick={handleTimerClick}
      disabled={isProcessing}
      className={`
        inline-flex items-center gap-2 px-2 py-[9px] rounded-[32px] text-[13px] font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        min-w-[110px] min-h-[46px] sm:min-h-0 justify-center
        bg-foreground text-background hover:opacity-90
      `}
    >
      <PauseIcon size={12} />
      {formatTime(elapsedSeconds)}
    </button>
  ) : (
    <Popover open={showPopover} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <button
          onClick={handleTimerClick}
          disabled={isProcessing}
          className={`
            inline-flex items-center gap-2 px-2 py-[9px] rounded-[32px] text-[13px] font-medium
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            min-w-[110px] min-h-[46px] sm:min-h-0 justify-center
            border border-border hover:bg-muted
          `}
        >
          <PlayIcon size={13} />
          Start timer
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-3 rounded-xl" 
        align="end"
        side="bottom"
        sideOffset={8}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleStartWithDescription} className="flex items-center gap-2">
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowPopover(false)
                setDescription('')
              }
            }}
          />
          <Button 
            type="submit" 
            size="default"
            disabled={isProcessing}
            className="shrink-0 !min-w-0 w-auto"
          >
            Start
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  )

  const columns: ListRowColumn[] = [
    {
      type: 'custom',
      className: 'hidden sm:table-cell',
      content: (
        <div className="flex flex-col gap-0.5">
          <p className="text-[14px] font-medium text-foreground">
            {formatCurrency(realTimeMoney, project.currency || 'CHF')}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {Math.floor(realTimeTrackedMinutes / 60)} hours
          </p>
        </div>
      ),
    },
    {
      type: 'custom',
      className: 'hidden sm:table-cell',
      content: (
        <p className="text-[14px] font-medium text-foreground">
          {formatCurrency(project.billedAmount, project.currency || 'CHF')}
        </p>
      ),
    },
    {
      type: 'custom',
      className: 'hidden sm:table-cell',
      content: (
        <p className="text-[14px] font-medium text-foreground">
          {project.hourly_rate ? formatCurrency(project.hourly_rate, project.currency || 'CHF') : '-'}
        </p>
      ),
    },
  ]

  return (
    <ListRow
      onClick={handleRowClick}
      primary={{
        text: project.name,
        label: project.customerName,
      }}
      columns={columns}
      actions={{
        custom: timerButton,
      }}
      padding="compact"
    />
  )
}

// Empty state component for active projects
function ActiveProjectsEmptyState() {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <Folder className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-[18px] font-semibold mb-2 text-foreground">
        No active projects
      </h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-sm mb-6">
        Create a project to track time, bill clients, and keep invoices organized.
      </p>
      <Button 
        variant="default" 
        onClick={() => router.push('/dashboard/projects/new?returnTo=/dashboard')}
        className="gap-4 text-[13px] pt-[14px] pb-[14px] pl-6 pr-8 font-light w-fit"
      >
        <ProjectsIcon size={16} />
        Create a new project
      </Button>
    </div>
  )
}

export default function DashboardProjectsTable() {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { data: allProjects = [] } = useProjects()
  const { data: allTimeEntries = [] } = useTimeEntries()
  const { data: allInvoices = [] } = useInvoices()
  const { data: allContacts = [] } = useContacts()
  const { data: runningTimer } = useRunningTimer()
  const [isProcessing, setIsProcessing] = useState(false)

  // Filter to active projects and calculate stats
  const projectsWithStats = useMemo(() => {
    const activeProjects = allProjects.filter(p => p.status === 'active')
    
    return activeProjects.map(project => {
      const projectTimeEntries = allTimeEntries.filter(entry => entry.project_id === project.id && entry.is_billable)
      const projectInvoices = allInvoices.filter(inv => inv.project_id === project.id)
      
      const timeTracked = projectTimeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0)
      
      // Calculate billed from invoices
      const billedAmount = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      
      // Calculate billed time from time entries that are invoiced
      const billedTimeEntries = projectTimeEntries.filter(entry => entry.status === 'invoiced' || entry.status === 'paid')
      const billed = billedTimeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0)
      
      const customer = allContacts.find(c => c.id === project.contact_id)
      const customerName = customer?.company_name || customer?.name || 'Unknown Customer'

      return {
        ...project,
        timeTracked,
        billed,
        billedAmount,
        customerName
      }
    })
  }, [allProjects, allTimeEntries, allInvoices, allContacts])

  const handleStartTimer = async (projectId: string, description?: string) => {
    if (!session) return
    
    const project = allProjects.find(p => p.id === projectId)
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await startTimerWithClient(supabase, session.user.id, {
        project_id: projectId,
        description: description || undefined,
        hourly_rate: project?.hourly_rate ?? null,
        date: new Date().toISOString().split('T')[0],
      })
      
      await queryClient.invalidateQueries({ queryKey: ['runningTimer'] })
      await queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
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

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {projectsWithStats.length === 0 ? (
          <ActiveProjectsEmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="px-3.5 py-3 text-[12px] font-medium capitalize" style={{ color: 'rgba(61, 61, 61, 1)' }}>
                  Projects
                </TableHead>
                <TableHead className="hidden sm:table-cell px-3.5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Time tracked
                </TableHead>
                <TableHead className="hidden sm:table-cell px-3.5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Billed
                </TableHead>
                <TableHead className="hidden sm:table-cell px-3.5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Hourly rate
                </TableHead>
                <TableHead className="px-3.5 py-3 text-right text-[12px] font-medium text-muted-foreground capitalize">
                  Time tracking
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsWithStats.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  runningTimer={runningTimer || null}
                  onStartTimer={handleStartTimer}
                  onStopTimer={handleStopTimer}
                  isProcessing={isProcessing}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

