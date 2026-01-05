'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { createProjectWithClient, type CreateProjectInput } from '@/lib/services/projectService.client'
import { Loader2 } from 'lucide-react'
import BackLink from '@/app/components/BackLink'
import { Card } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import Input from '@/app/components/Input'
import { useContacts } from '@/lib/hooks/queries'

export default function NewProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const { data: contacts = [] } = useContacts()
  const customers = contacts.filter(c => c.type === 'customer')
  
  // Get preselected customer from query params (if coming from invoice creation)
  const preselectedCustomerId = searchParams.get('customerId')
  
  // Create Supabase client (memoized)
  const supabase = useMemo(() => {
    if (!session) return null
    return createClientSupabaseClient(session)
  }, [session])

  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    contact_id: preselectedCustomerId || '',
    description: '',
    status: 'active',
    hourly_rate: undefined,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFieldChange = (field: keyof CreateProjectInput) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (field === 'hourly_rate') {
      const value = e.target.value
      const numValue = value === '' ? undefined : parseFloat(value)
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue as number) ? undefined : numValue }))
    } else {
      setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      setError('Project name is required')
      return
    }

    if (!formData.contact_id) {
      setError('Customer is required')
      return
    }

    if (!supabase || !user) {
      alert('Please sign in to create a project')
      return
    }

    setIsSaving(true)
    setError(null)
    
    try {
      await createProjectWithClient(supabase, user.id, {
        name: formData.name.trim(),
        contact_id: formData.contact_id,
        description: formData.description?.trim() || undefined,
        status: formData.status || 'active',
        hourly_rate: formData.hourly_rate,
      })
      
      // Invalidate queries to refetch the list
      await queryClient.invalidateQueries({ queryKey: ['projects', user.id] })
      
      // If coming from invoice creation, go back with project ID
      const returnTo = searchParams.get('returnTo')
      if (returnTo) {
        router.push(returnTo)
      } else {
        // Redirect to projects list
        router.push('/dashboard/projects')
      }
    } catch (err) {
      console.error('Error saving project:', err)
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (!session || !user || !supabase) {
    return (
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Back Link */}
      <BackLink to="/dashboard/projects" label="Back to Projects" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
            New Project
          </h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Project Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
        {/* Project Details Card */}
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-6">
            {/* Project Name */}
            <Input
              label="Project Name *"
              value={formData.name || ''}
              onChange={handleFieldChange('name')}
              placeholder="Website Redesign"
              required
            />

            {/* Customer */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Customer *
              </label>
              <select
                name="contact_id"
                value={formData.contact_id}
                onChange={handleFieldChange('contact_id')}
                required
                className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:ring-2 focus:ring-design-button-primary focus:border-transparent cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name || customer.name}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="text-[12px] text-design-content-weak mt-1">
                  No customers yet. <Link href="/dashboard/customers/new" className="text-design-button-primary hover:underline">Create one first</Link>.
                </p>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFieldChange('status')}
                className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:ring-2 focus:ring-design-button-primary focus:border-transparent cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Hourly Rate */}
            <Input
              label="Hourly Rate (optional)"
              type="number"
              value={formData.hourly_rate !== undefined ? formData.hourly_rate.toString() : ''}
              onChange={handleFieldChange('hourly_rate')}
              placeholder="150.00"
              step="0.01"
              min="0"
            />
            <p className="text-[12px] text-design-content-weak -mt-4">
              Set the hourly rate for this project (e.g., 150.00)
            </p>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Description (optional)
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleFieldChange('description')}
                placeholder="Project description..."
                rows={4}
                className="w-full px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:ring-2 focus:ring-design-button-primary focus:border-transparent resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Footer buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const returnTo = searchParams.get('returnTo')
              if (returnTo) {
                router.push(returnTo)
              } else {
                router.push('/dashboard/projects')
              }
            }}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={isSaving || !formData.name?.trim() || !formData.contact_id}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

