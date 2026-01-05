'use client'

import { useState, useMemo } from 'react'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { createProjectWithClient, type CreateProjectInput } from '@/lib/services/projectService.client'
import Header from '@/app/components/Header'
import ProjectsList from './ProjectsList'
import AddProjectButton from './AddProjectButton'
import AddProjectModal from './AddProjectModal'
import type { ProjectWithStats } from './page'

interface ProjectsPageContentProps {
  initialProjects: ProjectWithStats[]
  error: string | null
}

export default function ProjectsPageContent({ 
  initialProjects, 
  error 
}: ProjectsPageContentProps) {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  const handleSave = async (data: CreateProjectInput) => {
    if (!supabase || !user) {
      throw new Error('Please sign in to create a project')
    }

    if (!data.name?.trim()) {
      throw new Error('Project name is required')
    }

    if (!data.contact_id) {
      throw new Error('Customer is required')
    }

    setIsSaving(true)
    
    try {
      await createProjectWithClient(supabase, user.id, {
        name: data.name.trim(),
        contact_id: data.contact_id,
        description: data.description?.trim() || undefined,
        status: data.status || 'active',
        hourly_rate: data.hourly_rate,
      })
      
      // Invalidate queries to refetch the list
      await queryClient.invalidateQueries({ queryKey: ['projects', user.id] })
      
      // Close modal
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error saving project:', err)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Projects"
        actions={<AddProjectButton onClick={() => setIsModalOpen(true)} />}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Projects List */}
      <ProjectsList 
        initialProjects={initialProjects} 
      />

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  )
}

