'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { AlertCircle } from 'lucide-react'
import type { Project } from '@/lib/services/projectService.client'
import { useContacts } from '@/lib/hooks/queries'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useQueryClient } from '@tanstack/react-query'
import CreatableCustomerSelect from '@/app/components/CreatableCustomerSelect'
import CreatableProjectSelect from '@/app/components/CreatableProjectSelect'
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
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])
  
  const [clientId, setClientId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  // Handle creating new client
  const handleClientCreated = async (contact: Contact) => {
    // Invalidate contacts query to refresh the list
    await queryClient.invalidateQueries({ queryKey: ['contacts'] })
    // Auto-select the newly created client
    setClientId(contact.id)
  }

  // Handle creating new project
  const handleProjectCreated = (newProject: Project) => {
    // Invalidate projects query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['projects'] })
    // Auto-select the newly created project
    setProjectId(newProject.id)
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

    onStart(projectId, description || undefined, selectedDay || undefined)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-white">
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
            {supabase && user ? (
              <CreatableCustomerSelect
                value={clientId}
                onChange={(value) => {
                  setClientId(value)
                  setProjectId('') // Reset project when client changes
                  setError(null)
                }}
                customers={customers}
                supabase={supabase}
                userId={user.id}
                onCustomerCreated={handleClientCreated}
                placeholder="Select a client"
                error={error && !clientId ? 'Please select a client' : undefined}
              />
            ) : (
              <div className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default flex items-center">
                Loading...
              </div>
            )}
          </div>

          {/* Project Field - Mandatory */}
          <div>
            <Label htmlFor="project">Project *</Label>
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
                placeholder={!clientId ? "Select a client first" : filteredProjects.length === 0 ? "No projects yet" : "Select a project"}
                error={error && !projectId ? 'Please select a project' : undefined}
              />
            ) : (
              <div className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default flex items-center">
                {!clientId ? "Select a client first" : "Loading..."}
              </div>
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
    </Dialog>
  )
}

