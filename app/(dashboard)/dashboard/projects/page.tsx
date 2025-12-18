'use client'

import { useMemo } from 'react'
import { useProjects, useInvoices, useContacts } from '@/lib/hooks/queries'
import { type Project } from '@/lib/services/projectService.client'
import ProjectsPageContent from './ProjectsPageContent'
import { Skeleton } from '@/app/components/ui/skeleton'

export interface ProjectWithStats extends Project {
  invoiceCount: number
  totalAmount: number
  customerName: string
}

function ProjectsPageSkeleton() {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const { data: allProjects = [], isLoading: isLoadingProjects } = useProjects()
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: allContacts = [], isLoading: isLoadingContacts } = useContacts()

  const isLoading = isLoadingProjects || isLoadingInvoices || isLoadingContacts

  // Compute stats for each project
  const projectsWithStats = useMemo(() => {
    return allProjects.map(project => {
      const projectInvoices = allInvoices.filter(inv => inv.project_id === project.id)
      const customer = allContacts.find(c => c.id === project.contact_id)
      const totalAmount = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)

      return {
        ...project,
        invoiceCount: projectInvoices.length,
        totalAmount,
        customerName: customer?.company_name || customer?.name || 'Unknown Customer'
      }
    })
  }, [allProjects, allInvoices, allContacts])

  if (isLoading) {
    return <ProjectsPageSkeleton />
  }

  return (
    <ProjectsPageContent 
      initialProjects={projectsWithStats} 
      error={null}
    />
  )
}

