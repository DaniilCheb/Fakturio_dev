'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/app/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover'
import AddProjectModal from '@/app/(dashboard)/dashboard/projects/AddProjectModal'
import type { Project, CreateProjectInput } from '@/lib/services/projectService.client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createProjectWithClient } from '@/lib/services/projectService.client'

interface CreatableProjectSelectProps {
  value?: string
  onChange: (value: string) => void
  projects: Project[]
  supabase: SupabaseClient | null
  userId: string
  customerId?: string
  onProjectCreated?: (project: Project) => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export default function CreatableProjectSelect({
  value,
  onChange,
  projects,
  supabase,
  userId,
  customerId,
  onProjectCreated,
  disabled = false,
  error,
  placeholder = 'Select a project',
}: CreatableProjectSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const selectedProject = projects.find((p) => p.id === value)
  const displayName = selectedProject
    ? selectedProject.name
    : placeholder

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    return project.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Show create option if search query doesn't match any project
  const showCreateOption =
    searchQuery.trim().length > 0 &&
    !filteredProjects.some(
      (p) => p.name.toLowerCase() === searchQuery.toLowerCase()
    )

  const handleSelect = (projectId: string) => {
    onChange(projectId)
    setOpen(false)
    setSearchQuery('')
  }

  const handleCreateClick = () => {
    setShowAddModal(true)
    setOpen(false)
    setSearchQuery('')
  }

  const handleProjectCreated = async (projectData: CreateProjectInput) => {
    if (!supabase) return

    setIsCreating(true)
    try {
      // Ensure customerId is set if provided
      const projectToCreate = {
        ...projectData,
        contact_id: projectData.contact_id || customerId,
      }

      const newProject = await createProjectWithClient(supabase, userId, projectToCreate)
      
      // Auto-select the new project
      onChange(newProject.id)
      
      // Call the callback if provided
      onProjectCreated?.(newProject)
      
      setShowAddModal(false)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Reset search query when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  if (!supabase) {
    // Fallback to disabled state if no supabase client
    return (
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default flex items-center',
            error && 'border-red-500'
          )}
        >
          {displayName}
        </div>
        {error && (
          <p className="text-red-500 text-[12px] mt-1">{error}</p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                'w-full h-[40px] justify-between bg-design-surface-field border border-design-border-default rounded-lg text-[14px] font-normal hover:bg-design-surface-field',
                error && 'border-red-500 focus:ring-red-500',
                !selectedProject && 'text-muted-foreground'
              )}
            >
              <span className="truncate">{displayName}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search projects or type to create one"
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {/* Always show "Create new" as first option when dropdown is open */}
                <CommandGroup>
                  <CommandItem
                    value="create-new"
                    onSelect={() => handleCreateClick()}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create new</span>
                  </CommandItem>
                </CommandGroup>

                {filteredProjects.length === 0 && searchQuery.trim().length === 0 ? (
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No projects found.
                    </div>
                  </CommandEmpty>
                ) : (
                  <>
                    {filteredProjects.length > 0 && (
                      <CommandGroup>
                        {filteredProjects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={`${project.name} ${project.id}`}
                            onSelect={() => handleSelect(project.id)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                value === project.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {project.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    {showCreateOption && (
                      <CommandGroup>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          Select an option or create one
                        </div>
                        <CommandItem
                          value={`create-${searchQuery}`}
                          onSelect={() => handleCreateClick()}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span>Create</span>
                            <span className="px-2 py-0.5 bg-muted rounded-md text-sm font-medium">
                              {searchQuery}
                            </span>
                          </div>
                        </CommandItem>
                      </CommandGroup>
                    )}
                    {filteredProjects.length === 0 && searchQuery.trim().length > 0 && !showCreateOption && (
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No projects found.
                        </div>
                      </CommandEmpty>
                    )}
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="text-red-500 text-[12px] mt-1">{error}</p>
        )}
      </div>

      {/* Add Project Modal */}
      {supabase && (
        <AddProjectModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false)
          }}
          onSave={handleProjectCreated}
          isLoading={isCreating}
          initialData={customerId ? {
            id: '',
            user_id: userId,
            contact_id: customerId,
            name: '',
            status: 'active',
            created_at: '',
            updated_at: ''
          } as Project : undefined}
        />
      )}
    </>
  )
}

