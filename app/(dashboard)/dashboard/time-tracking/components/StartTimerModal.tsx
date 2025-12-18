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
import { AlertCircle } from 'lucide-react'
import type { Project } from '@/lib/services/projectService.client'

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
  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Debug: Log projects to verify they're loading
  useEffect(() => {
    console.log('StartTimerModal - Projects loaded:', projects.length)
    console.log('StartTimerModal - Projects:', projects)
  }, [projects])

  const selectedProject = projects.find(p => p.id === projectId)
  const hasHourlyRate = selectedProject?.hourly_rate && selectedProject.hourly_rate > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
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

          <div>
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={(value) => {
              setProjectId(value)
              setError(null)
            }}>
              <SelectTrigger id="project" className="w-full">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent className="z-[100]" position="popper">
                {projects.length === 0 ? (
                  <SelectItem value="" disabled>
                    No projects available
                  </SelectItem>
                ) : (
                  projects.map((project) => {
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
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                No projects found. Please create a project first.
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
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!projectId || isProcessing}>
              ▶ Start Timer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

