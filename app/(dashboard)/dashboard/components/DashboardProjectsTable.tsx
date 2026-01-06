'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pause, Folder } from 'lucide-react'
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
import { formatCurrency } from '@/lib/utils/formatters'
import { ProjectsIcon } from '@/app/components/Icons'
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

function ProjectRow({ 
  project, 
  runningTimer,
  onStartTimer,
  onStopTimer,
  isProcessing
}: { 
  project: ProjectWithStats
  runningTimer: TimeEntry | null
  onStartTimer: (projectId: string) => void
  onStopTimer: () => void
  isProcessing: boolean
}) {
  const router = useRouter()
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
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
      onStartTimer(project.id)
    }
  }

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={handleRowClick}
    >
      <TableCell className="px-5 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[14px] font-medium text-foreground">
            {project.name}
          </p>
          <p className="text-[12px] text-muted-foreground capitalize">
            {project.customerName}
          </p>
        </div>
      </TableCell>
      <TableCell className="px-5 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-[14px] font-medium text-foreground">
            {formatCurrency(realTimeMoney, project.currency || 'CHF')}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {Math.floor(realTimeTrackedMinutes / 60)} hours
          </p>
        </div>
      </TableCell>
      <TableCell className="px-5 py-3">
        <p className="text-[14px] font-medium text-foreground">
          {formatCurrency(project.billedAmount, project.currency || 'CHF')}
        </p>
      </TableCell>
      <TableCell className="px-5 py-3">
        <p className="text-[14px] font-medium text-foreground">
          {project.hourly_rate ? formatCurrency(project.hourly_rate, project.currency || 'CHF') : '-'}
        </p>
      </TableCell>
      <TableCell className="px-5 py-3 text-right">
        <button
          onClick={handleTimerClick}
          disabled={isProcessing}
          className={`
            inline-flex items-center gap-2 px-2 py-2 rounded-md text-[12px] font-medium
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
            ${isTimerRunning 
              ? 'bg-foreground text-background hover:opacity-90' 
              : 'border border-border hover:bg-muted'
            }
          `}
        >
          {isTimerRunning ? (
            <>
              <Pause className="h-3 w-3" />
              {formatTime(elapsedSeconds)}
            </>
          ) : (
            <>
              <PlayIcon size={13} />
              Start timer
            </>
          )}
        </button>
      </TableCell>
    </TableRow>
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
        className="gap-2"
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

  const handleStartTimer = async (projectId: string) => {
    if (!session) return
    
    const project = allProjects.find(p => p.id === projectId)
    
    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient(session)
      await startTimerWithClient(supabase, session.user.id, {
        project_id: projectId,
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
    <Card className="overflow-hidden group">
      <div className="border-b border-border px-5 py-2 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
          ACTIVE PROJECTS
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/projects/new?returnTo=/dashboard')}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-auto py-1.5 px-2 text-[12px]"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Project
        </Button>
      </div>
      <CardContent className="p-0">
        {projectsWithStats.length === 0 ? (
          <ActiveProjectsEmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="px-5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Projects
                </TableHead>
                <TableHead className="px-5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Time tracked
                </TableHead>
                <TableHead className="px-5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Billed
                </TableHead>
                <TableHead className="px-5 py-3 text-[12px] font-medium text-muted-foreground capitalize">
                  Hourly rate
                </TableHead>
                <TableHead className="px-5 py-3 text-right text-[12px] font-medium text-muted-foreground capitalize">
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

