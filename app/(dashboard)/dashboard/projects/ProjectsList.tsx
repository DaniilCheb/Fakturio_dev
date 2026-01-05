'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { 
  deleteProjectWithClient, 
  updateProjectWithClient,
  type CreateProjectInput
} from '@/lib/services/projectService.client'
import AddProjectModal from './AddProjectModal'
import { useConfirmDialog } from '@/app/components/useConfirmDialog'
import { EditIcon, DeleteIcon, ProjectsIcon } from '@/app/components/Icons'
import { formatCurrency } from '@/lib/utils/formatters'

// Format duration helper
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
import TableRowLabel from '@/app/components/TableRowLabel'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { Button } from '@/app/components/ui/button'
import { Folder } from 'lucide-react'
import type { ProjectWithStats } from './page'

interface ProjectsListProps {
  initialProjects: ProjectWithStats[]
}

// Empty state component
function EmptyState() {
  const router = useRouter()
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-6 rounded-full bg-muted flex items-center justify-center">
        <Folder className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-[18px] font-semibold mb-2">
        No projects yet
      </h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-sm mb-6">
        Create your first project to organize your work and track invoices.
      </p>
      <Button variant="default" onClick={() => router.push('/dashboard/projects/new')}>
        <ProjectsIcon size={16} className="mr-2" />
        New Project
      </Button>
    </div>
  )
}

// Project row component
function ProjectRow({ 
  project, 
  onEdit, 
  onDelete, 
  isLoading 
}: { 
  project: ProjectWithStats
  onEdit: () => void
  onDelete: () => void
  isLoading: boolean
}) {
  return (
    <TableRow className="group cursor-pointer hover:bg-muted/50">
      <TableCell className="font-medium px-6">
        <Link href={`/dashboard/projects/${project.id}`} className="block">
          <TableRowLabel 
            mainText={project.name} 
            labelText={project.customerName}
          />
        </Link>
      </TableCell>
      <TableCell className="text-[14px] text-muted-foreground px-6">
        {project.invoiceCount} {project.invoiceCount !== 1 ? 'invoices' : 'invoice'}
      </TableCell>
      <TableCell className="text-[14px] text-muted-foreground px-6">
        {formatDuration(project.timeTracked)}
      </TableCell>
      <TableCell className="text-[14px] font-medium px-6">
        {formatCurrency(project.totalAmount)}
      </TableCell>
      <TableCell className="text-right px-6">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onEdit()
            }}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            title="Edit project"
          >
            <EditIcon size={16} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDelete()
            }}
            disabled={isLoading}
            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors disabled:opacity-50"
            title="Delete project"
          >
            <DeleteIcon size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function ProjectsList({ 
  initialProjects
}: ProjectsListProps) {
  const { session } = useSession()
  const queryClient = useQueryClient()
  const [projects, setProjects] = useState<ProjectWithStats[]>(initialProjects)
  const [editingProject, setEditingProject] = useState<ProjectWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { confirm, DialogComponent } = useConfirmDialog()

  const handleUpdateProject = async (projectData: CreateProjectInput) => {
    if (!session || !editingProject) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      const updated = await updateProjectWithClient(supabase, userId, editingProject.id, projectData)

      // Preserve existing stats when updating
      const updatedWithStats: ProjectWithStats = {
        ...updated,
        invoiceCount: editingProject.invoiceCount,
        totalAmount: editingProject.totalAmount,
        customerName: editingProject.customerName
      }

      setProjects(prev => prev.map(p => p.id === updated.id ? updatedWithStats : p))
      setEditingProject(null)
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!session) return
    
    const confirmed = await confirm({
      message: 'Are you sure you want to delete this project?',
      variant: 'destructive',
    })
    
    if (!confirmed) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await deleteProjectWithClient(supabase, userId, projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete project')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {DialogComponent}
      
      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Projects Table */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[13px] font-medium px-6">Project</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Invoices</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Time Tracked</TableHead>
                  <TableHead className="text-[13px] font-medium px-6">Amount</TableHead>
                  <TableHead className="text-right text-[13px] font-medium px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onEdit={() => setEditingProject(project)}
                    onDelete={() => handleDelete(project.id)}
                    isLoading={isLoading}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Project Modal */}
      <AddProjectModal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        onSave={handleUpdateProject}
        isLoading={isLoading}
        initialData={editingProject || undefined}
        isEditing
      />
    </>
  )
}

