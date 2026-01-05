'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { AlertCircle, Trash2, Plus } from 'lucide-react'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useQueryClient } from '@tanstack/react-query'
import { useContacts } from '@/lib/hooks/queries'
import { saveContactWithClient, type CreateContactInput } from '@/lib/services/contactService.client'
import { createProjectWithClient, type CreateProjectInput } from '@/lib/services/projectService.client'
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
  entry,
  onUpdate,
  onDelete,
}: ManualEntryModalProps) {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { data: contacts = [] } = useContacts()
  const customers = contacts.filter(c => c.type === 'customer')
  
  const isEditMode = !!entry
  
  // Calculate hours and minutes from duration_minutes for edit mode
  const getHoursFromMinutes = (minutes: number) => Math.floor(minutes / 60).toString()
  const getMinutesFromDuration = (minutes: number) => (minutes % 60).toString()
  
  // Get client from entry's project
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
        return entry.hourly_rate.toString()
      }
    }
    return ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Modals for adding client/project
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  
  // New client/project form data
  const [newClientData, setNewClientData] = useState<CreateContactInput>({
    type: 'customer',
    name: '',
    company_name: '',
    email: '',
    phone: '',
  })
  const [newProjectData, setNewProjectData] = useState<CreateProjectInput>({
    name: '',
    contact_id: '',
    description: '',
    status: 'active',
    hourly_rate: undefined,
  })

  // Filter projects by selected client
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
        setCustomRate(entry.hourly_rate.toString())
      } else {
        setCustomRate('')
      }
    }
  }, [entry, projects])
  
  // Reset project when client changes
  useEffect(() => {
    if (clientId && projectId) {
      const project = projects.find(p => p.id === projectId)
      if (project?.contact_id !== clientId) {
        setProjectId('')
      }
    }
  }, [clientId, projectId, projects])

  const selectedProject = projects.find(p => p.id === projectId)
  const hasProjectRate = selectedProject?.hourly_rate && selectedProject.hourly_rate > 0
  const hourlyRate: number = hasProjectRate && selectedProject.hourly_rate 
    ? selectedProject.hourly_rate 
    : (parseFloat(customRate) || 0)

  // Handle creating new client
  const handleCreateClient = async () => {
    if (!session || !user) {
      setError('Please sign in to create a client')
      return
    }
    
    if (!newClientData.name.trim()) {
      setError('Client name is required')
      return
    }
    
    setIsCreatingClient(true)
    setError(null)
    
    try {
      const supabase = createClientSupabaseClient(session)
      const newClient = await saveContactWithClient(supabase, user.id, newClientData)
      
      // Invalidate contacts query
      await queryClient.invalidateQueries({ queryKey: ['contacts', user.id] })
      
      // Set the new client as selected
      setClientId(newClient.id)
      setShowAddClientModal(false)
      setNewClientData({
        type: 'customer',
        name: '',
        company_name: '',
        email: '',
        phone: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client')
    } finally {
      setIsCreatingClient(false)
    }
  }

  // Handle creating new project
  const handleCreateProject = async () => {
    if (!session || !user) {
      setError('Please sign in to create a project')
      return
    }
    
    if (!newProjectData.name.trim()) {
      setError('Project name is required')
      return
    }
    
    if (!clientId) {
      setError('Please select a client first')
      return
    }
    
    setIsCreatingProject(true)
    setError(null)
    
    try {
      const supabase = createClientSupabaseClient(session)
      const newProject = await createProjectWithClient(supabase, user.id, {
        ...newProjectData,
        contact_id: clientId,
      })
      
      // Invalidate projects query
      await queryClient.invalidateQueries({ queryKey: ['projects', user.id] })
      
      // Set the new project as selected
      setProjectId(newProject.id)
      setShowAddProjectModal(false)
      setNewProjectData({
        name: '',
        contact_id: '',
        description: '',
        status: 'active',
        hourly_rate: undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!clientId) {
      setError('Please select a client')
      return
    }

    // If no project selected, create a default project
    let finalProjectId = projectId
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManualEntryModal.tsx:271',message:'handleSubmit - processing projectId',data:{projectId:projectId,finalProjectId:finalProjectId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
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
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Time Entry' : 'Add Manual Entry'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Client Field - Mandatory */}
            <div>
              <Label htmlFor="client" className="mb-1">Client *</Label>
              <Select 
                value={clientId} 
                onValueChange={(value) => {
                  setClientId(value)
                  setProjectId('') // Reset project when client changes
                  setError(null)
                }}
              >
                <SelectTrigger id="client" className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper">
                  {customers.length === 0 ? (
                    <SelectItem value="" disabled>
                      No clients available
                    </SelectItem>
                  ) : (
                    customers.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name || client.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => setShowAddClientModal(true)}
                className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors mt-1"
              >
                <Plus size={12} />
                Add Client
              </button>
              {customers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  No clients found. Click &quot;Add Client&quot; to create one.
                </p>
              )}
            </div>

            {/* Project Field - Optional */}
            <div>
              <Label htmlFor="project" className="mb-1">Project (optional)</Label>
              <Select 
                value={projectId || '__none__'} 
                onValueChange={(value) => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManualEntryModal.tsx:428',message:'onValueChange - project select',data:{value:value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
                  // #endregion
                  setProjectId(value === '__none__' ? '' : value)
                  setError(null)
                }}
                disabled={!clientId}
              >
                <SelectTrigger id="project" className="w-full">
                  <SelectValue placeholder={clientId ? "Select a project (optional)" : "Select a client first"} />
                </SelectTrigger>
                <SelectContent className="z-[100]" position="popper">
                  {(() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManualEntryModal.tsx:435',message:'SelectContent render - checking conditions',data:{hasClientId:!!clientId,filteredProjectsCount:filteredProjects.length,projectId:projectId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    if (!clientId) {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManualEntryModal.tsx:437',message:'Rendering disabled SelectItem - no client',data:{value:''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                      // #endregion
                      return (
                        <SelectItem value="__disabled_no_client__" disabled>
                          Select a client first
                        </SelectItem>
                      )
                    } else if (filteredProjects.length === 0) {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManualEntryModal.tsx:441',message:'Rendering disabled SelectItem - no projects',data:{value:''},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                      // #endregion
                      return (
                        <SelectItem value="__disabled_no_projects__" disabled>
                          No projects available
                        </SelectItem>
                      )
                    } else {
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ManualEntryModal.tsx:445',message:'Rendering project options including None option',data:{filteredProjectsCount:filteredProjects.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                      // #endregion
                      return (
                        <>
                          <SelectItem value="__none__">None (General)</SelectItem>
                          {filteredProjects.map((project) => {
                            const hasRate = project.hourly_rate && project.hourly_rate > 0
                            return (
                              <SelectItem key={project.id} value={project.id}>
                                <div className="flex items-center gap-2">
                                  <span>{project.name}</span>
                                  {hasRate ? (
                                    <span className="text-xs text-muted-foreground">
                                      ({project.hourly_rate} CHF/h)
                                    </span>
                                  ) : (
                                    <span className="text-xs text-destructive">
                                      (No rate)
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </>
                      )
                    }
                  })()}
                </SelectContent>
              </Select>
              {clientId && (
                <button
                  type="button"
                  onClick={() => {
                    setNewProjectData(prev => ({ ...prev, contact_id: clientId }))
                    setShowAddProjectModal(true)
                  }}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors mt-1"
                >
                  <Plus size={12} />
                  Add Project
                </button>
              )}
              {!projectId && (
                <p className="text-xs text-muted-foreground mt-1">
                  If no project is selected, a default &quot;General&quot; project will be created.
                </p>
              )}
            </div>

            {/* Show hourly rate input if project doesn't have one */}
            {(!selectedProject || !hasProjectRate) && (
              <div>
                <Label htmlFor="customRate">Hourly Rate (CHF) *</Label>
                <Input
                  id="customRate"
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
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedProject 
                    ? "This project doesn't have an hourly rate. Enter the rate for this entry."
                    : "Enter the hourly rate for this entry."
                  }
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
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
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>

            <div className="flex justify-between gap-2">
              {isEditMode && entry && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isDeleting || isProcessing}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting || isProcessing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!clientId || isProcessing || isDeleting}>
                  {isEditMode ? 'Update Entry' : 'Add Entry'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Client Modal */}
      <Dialog open={showAddClientModal} onOpenChange={setShowAddClientModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Name *</Label>
              <Input
                id="clientName"
                value={newClientData.name}
                onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Client name"
                required
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={newClientData.company_name || ''}
                onChange={(e) => setNewClientData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Company name (optional)"
              />
            </div>
            <div>
              <Label htmlFor="clientEmail">Email</Label>
              <Input
                id="clientEmail"
                type="email"
                value={newClientData.email || ''}
                onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label htmlFor="clientPhone">Phone</Label>
              <Input
                id="clientPhone"
                value={newClientData.phone || ''}
                onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowAddClientModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateClient} disabled={isCreatingClient || !newClientData.name.trim()}>
                {isCreatingClient ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Project Modal */}
      <Dialog open={showAddProjectModal} onOpenChange={setShowAddProjectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={newProjectData.name}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Project name"
                required
              />
            </div>
            <div>
              <Label htmlFor="projectRate">Hourly Rate (CHF)</Label>
              <Input
                id="projectRate"
                type="number"
                min="0"
                step="0.01"
                value={newProjectData.hourly_rate || ''}
                onChange={(e) => setNewProjectData(prev => ({ 
                  ...prev, 
                  hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="150.00"
              />
            </div>
            <div>
              <Label htmlFor="projectDescription">Description</Label>
              <Input
                id="projectDescription"
                value={newProjectData.description || ''}
                onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description (optional)"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowAddProjectModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject} disabled={isCreatingProject || !newProjectData.name.trim()}>
                {isCreatingProject ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
