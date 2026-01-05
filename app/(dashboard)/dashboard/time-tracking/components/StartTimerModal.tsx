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
import { AlertCircle, Plus } from 'lucide-react'
import type { Project } from '@/lib/services/projectService.client'
import { useContacts } from '@/lib/hooks/queries'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useQueryClient } from '@tanstack/react-query'
import AddCustomerModal from '@/app/components/invoice/AddCustomerModal'
import type { Contact } from '@/lib/services/contactService.client'

interface StartTimerModalProps {
  projects: Project[]
  onStart: (projectId: string, description?: string, date?: string) => void
  onClose: () => void
  isProcessing: boolean
  selectedDay?: string | null
}

export default function StartTimerModal({
  projects,
  onStart,
  onClose,
  isProcessing,
  selectedDay,
}: StartTimerModalProps) {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { data: contacts = [] } = useContacts()
  const customers = contacts.filter(c => c.type === 'customer')
  
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Filter projects by selected client
  const filteredProjects = clientId 
    ? projects.filter(p => p.contact_id === clientId)
    : projects

  // Debug: Log projects to verify they're loading
  useEffect(() => {
    console.log('StartTimerModal - Projects loaded:', projects.length)
    console.log('StartTimerModal - Projects:', projects)
  }, [projects])

  // Reset project when client changes
  useEffect(() => {
    setProjectId('')
  }, [clientId])

  const selectedProject = filteredProjects.find(p => p.id === projectId)
  const hasHourlyRate = selectedProject?.hourly_rate && selectedProject.hourly_rate > 0

  // Handle creating new client
  const handleClientCreated = async (contact: Contact) => {
    // The AddCustomerModal handles the creation, we just need to refresh
    await queryClient.invalidateQueries({ queryKey: ['contacts', user?.id] })
    // Auto-select the newly created client
    setClientId(contact.id)
    setShowAddClientModal(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!clientId) {
      setError('Please select a client')
      return
    }
    
    if (!projectId) {
      setError('Please select a project')
      return
    }

    if (!hasHourlyRate) {
      setError('This project does not have an hourly rate set. Please set an hourly rate for the project first.')
      return
    }

    onStart(projectId, description || undefined, selectedDay || undefined)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Timer</DialogTitle>
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
              <SelectTrigger id="client" className="w-full bg-design-surface-field dark:bg-[#252525]">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="z-[100]" position="popper">
                {customers.length === 0 ? (
                  <SelectItem value="__disabled_no_clients__" disabled>
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

          {/* Project Field - Mandatory */}
          <div>
            <Label htmlFor="project">Project *</Label>
            <Select 
              value={projectId} 
              onValueChange={(value) => {
                setProjectId(value)
                setError(null)
              }}
              disabled={!clientId}
            >
              <SelectTrigger id="project" className="w-full bg-design-surface-field dark:bg-[#252525]">
                <SelectValue placeholder={clientId ? "Select a project" : "Select a client first"} />
              </SelectTrigger>
              <SelectContent className="z-[100]" position="popper">
                {!clientId ? (
                  <SelectItem value="__disabled_no_client__" disabled>
                    Select a client first
                  </SelectItem>
                ) : filteredProjects.length === 0 ? (
                  <SelectItem value="__disabled_no_projects__" disabled>
                    No projects available
                  </SelectItem>
                ) : (
                  filteredProjects.map((project) => {
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
                  })
                )}
              </SelectContent>
            </Select>
            {clientId && filteredProjects.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No projects found for this client. Please create a project first.
              </p>
            )}
            {selectedProject && !hasHourlyRate && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This project needs an hourly rate to start a timer. Please set an hourly rate in the project settings.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">What are you working on? (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Design review, Bug fixes..."
              className="bg-white dark:bg-[#252525]"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!clientId || !projectId || isProcessing}>
              ▶ Start Timer
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Add Client Modal */}
      {showAddClientModal && session && user && (
        <AddCustomerModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onCustomerCreated={handleClientCreated}
          supabase={createClientSupabaseClient(session)}
          userId={user.id}
        />
      )}
    </Dialog>
  )
}

