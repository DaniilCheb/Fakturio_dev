'use client'

import Header from '@/app/components/Header'
import ProjectsList from './ProjectsList'
import AddProjectButton from './AddProjectButton'
import type { ProjectWithStats } from './page'

interface ProjectsPageContentProps {
  initialProjects: ProjectWithStats[]
  error: string | null
}

export default function ProjectsPageContent({ 
  initialProjects, 
  error 
}: ProjectsPageContentProps) {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      {/* Header */}
      <Header 
        title="Projects"
        actions={<AddProjectButton />}
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
    </div>
  )
}

