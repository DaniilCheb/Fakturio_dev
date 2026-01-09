'use client'

import { useMemo } from 'react'
import { useProjects, useInvoices, useContacts, useTimeEntries } from '@/lib/hooks/queries'
import { type Project } from '@/lib/services/projectService.client'
import ProjectsPageContent from './ProjectsPageContent'

export interface ProjectWithStats extends Project {
  invoiceCount: number
  totalAmount: number
  customerName: string
  timeTracked: number // in minutes
}

export default function ProjectsPage() {
  const { data: allProjects = [], isLoading: isLoadingProjects } = useProjects()
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: allContacts = [], isLoading: isLoadingContacts } = useContacts()
  const { data: allTimeEntries = [], isLoading: isLoadingTimeEntries } = useTimeEntries()

  // Compute stats for each project
  const projectsWithStats = useMemo(() => {
    return allProjects.map(project => {
      const projectInvoices = allInvoices.filter(inv => inv.project_id === project.id)
      const customer = allContacts.find(c => c.id === project.contact_id)
      const totalAmount = projectInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      const projectTimeEntries = allTimeEntries.filter(entry => entry.project_id === project.id && entry.is_billable)
      const timeTracked = projectTimeEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0)

      return {
        ...project,
        invoiceCount: projectInvoices.length,
        totalAmount,
        customerName: customer?.company_name || customer?.name || 'Unknown Customer',
        timeTracked
      }
    })
  }, [allProjects, allInvoices, allContacts, allTimeEntries])

  return (
    <ProjectsPageContent 
      initialProjects={projectsWithStats} 
      error={null}
    />
  )
}

