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
import type { CreateTimeEntryInput } from '@/lib/services/timeEntryService.client'

interface ManualEntryModalProps {
  projects: Project[]
  onCreate: (input: CreateTimeEntryInput) => void
  onClose: () => void
  isProcessing: boolean
  selectedDay?: string | null
}

export default function ManualEntryModal({
  projects,
  onCreate,
  onClose,
  isProcessing,
  selectedDay,
}: ManualEntryModalProps) {
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(() => selectedDay || new Date().toISOString().split('T')[0])
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [customRate, setCustomRate] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Debug: Log projects to verify they're loading
  useEffect(() => {
    console.log('ManualEntryModal - Projects loaded:', projects.length)
    console.log('ManualEntryModal - Projects:', projects)
  }, [projects])

  // Update date when selectedDay changes
  useEffect(() => {
    if (selectedDay) {
      setDate(selectedDay)
    }
  }, [selectedDay])

  const selectedProject = projects.find(p => p.id === projectId)
  const hasProjectRate = selectedProject?.hourly_rate && selectedProject.hourly_rate > 0
  const hourlyRate = hasProjectRate ? selectedProject.hourly_rate : (parseFloat(customRate) || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!projectId) {
      setError('Please select a project')
      return
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

    onCreate({
      project_id: projectId,
      date,
      duration_minutes: totalMinutes,
      hourly_rate: hourlyRate,
      description: description || undefined,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manual Entry</DialogTitle>
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
          </div>

          {/* Show hourly rate input if project doesn't have one */}
          {selectedProject && !hasProjectRate && (
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
                This project doesn&apos;t have an hourly rate. Enter the rate for this entry.
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!projectId || isProcessing}>
              Add Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

