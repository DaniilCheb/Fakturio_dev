'use client'

import { notFound } from "next/navigation"
import { useParams } from "next/navigation"
import { useProject, useInvoices, useContacts } from "@/lib/hooks/queries"
import ProjectDetailClient from "./ProjectDetailClient"
import { Skeleton } from "@/app/components/ui/skeleton"

function ProjectDetailSkeleton() {
  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const { data: project, isLoading: isLoadingProject } = useProject(projectId)
  const { data: allInvoices = [], isLoading: isLoadingInvoices } = useInvoices()
  const { data: allContacts = [] } = useContacts()

  if (isLoadingProject || isLoadingInvoices) {
    return <ProjectDetailSkeleton />
  }

  if (!project) {
    notFound()
  }

  // Filter invoices for this project
  const projectInvoices = allInvoices.filter(inv => inv.project_id === project.id)
  const customer = allContacts.find(c => c.id === project.contact_id)

  return (
    <div className="max-w-[800px] mx-auto space-y-8">
      <ProjectDetailClient 
        project={project}
        invoices={projectInvoices}
        customer={customer}
      />
    </div>
  )
}

