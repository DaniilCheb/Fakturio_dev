'use client'

import { useState, useEffect, useMemo } from 'react'
import Modal, { ModalBody, ModalFooter } from '@/app/components/Modal'
import Button from '@/app/components/Button'
import Input from '@/app/components/Input'
import DatePicker from '@/app/components/DatePicker'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useQueryClient } from '@tanstack/react-query'
import { useContacts } from '@/lib/hooks/queries'
import CreatableCustomerSelect from '@/app/components/CreatableCustomerSelect'
import CreatableProjectSelect from '@/app/components/CreatableProjectSelect'
import CurrencyPicker from '@/app/components/CurrencyPicker'
import { createProjectWithClient } from '@/lib/services/projectService.client'
import type { Contact } from '@/lib/services/contactService.client'
import type { Project } from '@/lib/services/projectService.client'
import type { CreateTimeEntryInput, TimeEntry } from '@/lib/services/timeEntryService.client'

interface ManualEntryModalProps {
  projects: Project[]
  onCreate: (input: CreateTimeEntryInput) => void
  onClose: () => void
  isProcessing: boolean
  selectedDay?: string | null
  prefillHours?: string
  prefillMinutes?: string
  prefillStartTime?: string  // ISO timestamp for calendar positioning
  prefillEndTime?: string    // ISO timestamp for calendar positioning
  entry?: TimeEntry | null
  onUpdate?: (entryId: string, input: CreateTimeEntryInput) => Promise<void>
  onDelete?: (entryId: string) => Promise<void>
}

export default function ManualEntryModal({
  projects,
  onCreate,
  onClose,
  isProcessing,
  selectedDay,
  prefillHours,
  prefillMinutes,
  prefillStartTime,
  prefillEndTime,
  entry,
  onUpdate,
  onDelete,
}: ManualEntryModalProps) {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { data: contacts = [] } = useContacts()
  const customers = contacts.filter(c => c.type === 'customer')
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])
  
  const isEditMode = !!entry
  
  // Calculate hours and minutes from duration_minutes for edit mode
  const getHoursFromMinutes = (minutes: number) => Math.floor(minutes / 60).toString()
  const getMinutesFromDuration = (minutes: number) => (minutes % 60).toString()
  
  // Get customer from entry's project
  const entryClientId = entry ? projects.find(p => p.id === entry.project_id)?.contact_id : null
  
  const [clientId, setClientId] = useState(() => entryClientId || '')
  const [projectId, setProjectId] = useState(() => entry?.project_id || '')
  const [date, setDate] = useState(() => entry?.date || selectedDay || new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState(() => {
    if (entry) return getHoursFromMinutes(entry.duration_minutes)
    return prefillHours || ''
  })
  const [minutes, setMinutes] = useState(() => {
    if (entry) return getMinutesFromDuration(entry.duration_minutes)
    return prefillMinutes || ''
  })
  const [description, setDescription] = useState(() => entry?.description || '')
  const [customRate, setCustomRate] = useState(() => {
    // If entry exists and project doesn't have a rate, use entry's rate
    if (entry) {
      const project = projects.find(p => p.id === entry.project_id)
      if (!project?.hourly_rate || project.hourly_rate === 0) {
        return entry.hourly_rate?.toString() || ''
      }
    }
    return ''
  })
  const [currency, setCurrency] = useState(() => {
    // Get currency from project if available, otherwise default to CHF
    if (entry) {
      const project = projects.find(p => p.id === entry.project_id)
      return project?.currency || 'CHF'
    }
    return 'CHF'
  })
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter projects by selected customer
  const filteredProjects = clientId 
    ? projects.filter(p => p.contact_id === clientId)
    : projects

  // Update date when selectedDay changes
  useEffect(() => {
    if (selectedDay) {
      setDate(selectedDay)
    }
  }, [selectedDay])

  // Update hours and minutes when prefill values change (only in create mode)
  useEffect(() => {
    if (!isEditMode) {
      if (prefillHours !== undefined) {
        setHours(prefillHours)
      }
      if (prefillMinutes !== undefined) {
        setMinutes(prefillMinutes)
      }
    }
  }, [prefillHours, prefillMinutes, isEditMode])
  
  // Update form when entry changes (edit mode)
  useEffect(() => {
    if (entry) {
      const project = projects.find(p => p.id === entry.project_id)
      setClientId(project?.contact_id || '')
      setProjectId(entry.project_id)
      setDate(entry.date)
      setHours(getHoursFromMinutes(entry.duration_minutes))
      setMinutes(getMinutesFromDuration(entry.duration_minutes))
      setDescription(entry.description || '')
      if (!project?.hourly_rate || project.hourly_rate === 0) {
        setCustomRate(entry.hourly_rate?.toString() || '')
      } else {
        setCustomRate('')
      }
      setCurrency(project?.currency || 'CHF')
    }
  }, [entry, projects])
  
  const selectedProject = projects.find(p => p.id === projectId)
  
  // Update currency when project changes
  useEffect(() => {
    if (selectedProject?.currency) {
      setCurrency(selectedProject.currency)
    }
  }, [selectedProject])
  
  // Reset project when customer changes
  useEffect(() => {
    if (clientId && projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project?.contact_id !== clientId) {
        setProjectId('')
      }
    }
  }, [clientId, projectId, projects])
  const hasProjectRate = selectedProject?.hourly_rate && selectedProject.hourly_rate > 0
  const hourlyRate: number = hasProjectRate && selectedProject.hourly_rate 
    ? selectedProject.hourly_rate 
    : (parseFloat(customRate) || 0)

  // Handle creating new customer
  const handleCustomerCreated = async (contact: Contact) => {
    // Invalidate contacts query to refresh the list
    await queryClient.invalidateQueries({ queryKey: ['contacts'] })
    // Auto-select the newly created customer
    setClientId(contact.id)
  }

  // Handle creating new project
  const handleProjectCreated = (newProject: Project) => {
    // Invalidate projects query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    // Auto-select the newly created project
    setProjectId(newProject.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!clientId) {
      setError('Please select a customer')
      return
    }

    // If no project selected, create a default project
    let finalProjectId = projectId
    if (!finalProjectId) {
      if (!session || !user) {
        setError('Please sign in to create a time entry')
        return
      }
      
      try {
        const supabase = createClientSupabaseClient(session)
        const defaultProject = await createProjectWithClient(supabase, user.id, {
          name: 'General',
          contact_id: clientId,
          status: 'active',
        })
        finalProjectId = defaultProject.id
        await queryClient.invalidateQueries({ queryKey: ['projects', user.id] })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create default project')
        return
      }
    }

    const totalMinutes = (parseFloat(hours) || 0) * 60 + (parseFloat(minutes) || 0)
    if (totalMinutes <= 0) {
      setError('Please enter a valid duration')
      return
    }

    if (hourlyRate <= 0) {
      setError('Please enter an hourly rate')
      return
    }

    const input: CreateTimeEntryInput = {
      project_id: finalProjectId,
      date,
      duration_minutes: totalMinutes,
      hourly_rate: hourlyRate,
      description: description || undefined,
      // Include start/end times for proper calendar positioning
      ...(prefillStartTime && !isEditMode && { start_time: prefillStartTime }),
      ...(prefillEndTime && !isEditMode && { end_time: prefillEndTime }),
    }

    if (isEditMode && entry && onUpdate) {
      try {
        await onUpdate(entry.id, input)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update entry')
      }
    } else {
      onCreate(input)
    }
  }
  
  const handleDelete = async () => {
    if (!entry || !onDelete) return
    
    if (!confirm('Are you sure you want to delete this time entry? This action cannot be undone.')) {
      return
    }
    
    setIsDeleting(true)
    setError(null)
    
    try {
      await onDelete(entry.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry')
      setIsDeleting(false)
    }
  }

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Time Entry' : 'Add Manual Entry'}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Customer Field - Mandatory */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">Customer *</label>
            {supabase && user ? (
              <CreatableCustomerSelect
                value={clientId}
                onChange={(value) => {
                  setClientId(value)
                  setProjectId('') // Reset project when customer changes
                  setError(null)
                }}
                customers={customers}
                supabase={supabase}
                userId={user.id}
                onCustomerCreated={handleCustomerCreated}
                placeholder="Select a customer"
                error={error && !clientId ? 'Please select a customer' : undefined}
              />
            ) : (
              <div className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default flex items-center">
                Loading...
              </div>
            )}
          </div>

          {/* Project Field - Optional */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">Project (optional)</label>
            {supabase && user ? (
              <CreatableProjectSelect
                value={projectId || undefined}
                onChange={(value) => {
                  setProjectId(value)
                  setError(null)
                }}
                projects={filteredProjects}
                supabase={supabase}
                userId={user.id}
                customerId={clientId}
                onProjectCreated={handleProjectCreated}
                disabled={!clientId}
                placeholder={!clientId ? "Select a customer first" : filteredProjects.length === 0 ? "No projects yet" : "Select a project (optional)"}
              />
            ) : (
              <div className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default flex items-center">
                {!clientId ? "Select a customer first" : "Loading..."}
              </div>
            )}
          </div>

          {/* Show hourly rate input if project doesn't have one */}
          {(!selectedProject || !hasProjectRate) && (
            <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <Input
                  label="Hourly Rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customRate}
                  onChange={(e) => {
                    setCustomRate(e.target.value)
                    setError(null)
                  }}
                  placeholder="e.g., 150"
                  required
                />
              </div>
              <div className="pb-0">
                <CurrencyPicker
                  value={currency}
                  onChange={(value) => {
                    setCurrency(value)
                    setError(null)
                  }}
                  noLabel
                />
              </div>
            </div>
          )}

          <DatePicker
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Hours"
                type="number"
                min="0"
                step="0.25"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Input
                label="Minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Input
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
            />
          </div>
        </ModalBody>

        <ModalFooter className="justify-between">
          {isEditMode && entry && onDelete ? (
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting || isProcessing}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting || isProcessing}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!clientId || isProcessing || isDeleting}>
              {isEditMode ? 'Update Entry' : 'Add Entry'}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  )
}
