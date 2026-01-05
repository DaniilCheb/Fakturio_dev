'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { PlusIcon } from '../Icons'
import { Loader2 } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getContactsWithClient, Contact } from '@/lib/services/contactService.client'
import { getProjectsByCustomerWithClient, createProjectWithClient, Project, CreateProjectInput } from '@/lib/services/projectService.client'
import AddCustomerModal from './AddCustomerModal'
import AddProjectModal from '@/app/(dashboard)/dashboard/projects/AddProjectModal'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { cn } from '@/lib/utils'

export interface AuthToInfo {
  contact_id: string
  uid?: string
  name: string
  address: string
  zip: string
}

interface AuthToSectionProps {
  toInfo: AuthToInfo
  onChange: (toInfo: AuthToInfo) => void
  supabase: SupabaseClient
  userId: string
  projectId?: string
  onProjectChange?: (projectId: string | null) => void
  errors?: {
    toName?: string
    toAddress?: string
    toZip?: string
    contact_id?: string
  }
  onClearError?: (field: string) => void
}

export default function AuthToSection({
  toInfo,
  onChange,
  supabase,
  userId,
  projectId,
  onProjectChange,
  errors = {},
  onClearError
}: AuthToSectionProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  // Load contacts on mount
  useEffect(() => {
    async function loadContacts() {
      try {
        const fetchedContacts = await getContactsWithClient(supabase, userId)
        // Filter to only show customers
        const customers = fetchedContacts.filter(c => c.type === 'customer')
        setContacts(customers)
      } catch (error) {
        console.error('Error loading contacts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadContacts()
  }, [supabase, userId])

  // Format contact for display
  const formatContactDisplay = (contact: Contact): string => {
    if (contact.company_name && contact.company_name !== contact.name) {
      return `${contact.company_name} (${contact.name})`
    }
    return contact.company_name || contact.name
  }

  // Get the selected contact
  const selectedContact = useMemo(() => {
    return contacts.find(c => c.id === toInfo.contact_id)
  }, [contacts, toInfo.contact_id])

  // Load projects when customer is selected
  useEffect(() => {
    async function loadProjects() {
      if (!toInfo.contact_id) {
        setProjects([])
        // Clear project selection when customer is cleared
        onProjectChange?.(null)
        return
      }

      setIsLoadingProjects(true)
      try {
        const fetchedProjects = await getProjectsByCustomerWithClient(supabase, userId, toInfo.contact_id)
        setProjects(fetchedProjects)
      } catch (error) {
        console.error('Error loading projects:', error)
        setProjects([])
      } finally {
        setIsLoadingProjects(false)
      }
    }

    loadProjects()
  }, [toInfo.contact_id, supabase, userId, onProjectChange])

  const handleContactSelect = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId)
    if (contact) {
      // Build zip from postal_code and city
      const zipCity = [contact.postal_code, contact.city].filter(Boolean).join(' ')
      
      onChange({
        contact_id: contact.id,
        uid: contact.vat_number,
        name: contact.company_name || contact.name,
        address: contact.address || '',
        zip: zipCity
      })
      
      // Clear project selection when customer changes
      onProjectChange?.(null)
      
      // Clear errors
      onClearError?.('contact_id')
      onClearError?.('toName')
      onClearError?.('toAddress')
      onClearError?.('toZip')
    }
  }

  const handleProjectSelect = (selectedProjectId: string) => {
    onProjectChange?.(selectedProjectId === '' ? null : selectedProjectId)
  }

  const handleProjectCreated = async (projectData: CreateProjectInput) => {
    if (!toInfo.contact_id) {
      return
    }

    setIsCreatingProject(true)
    try {
      // Ensure contact_id is set from selected customer
      const newProject = await createProjectWithClient(supabase, userId, {
        ...projectData,
        contact_id: projectData.contact_id || toInfo.contact_id
      })
      
      // Add to local list
      setProjects(prev => [newProject, ...prev])
      
      // Auto-select the new project
      onProjectChange?.(newProject.id)
      
      setShowAddProjectModal(false)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsCreatingProject(false)
    }
  }

  const handleCustomerCreated = (contact: Contact) => {
    // Add to local list
    setContacts(prev => [contact, ...prev])
    
    // Auto-select the new contact
    const zipCity = [contact.postal_code, contact.city].filter(Boolean).join(' ')
    onChange({
      contact_id: contact.id,
      uid: contact.vat_number,
      name: contact.company_name || contact.name,
      address: contact.address || '',
      zip: zipCity
    })
    
    // Clear errors
    onClearError?.('contact_id')
    onClearError?.('toName')
    onClearError?.('toAddress')
    onClearError?.('toZip')
  }

  const hasError = errors.contact_id || errors.toName || errors.toAddress || errors.toZip

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        To
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Customer Dropdown */}
          <div className="flex flex-col gap-1" data-field="contact_id">
            <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              Select customer <span className="text-destructive">*</span>
            </Label>
            
            {isLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-[#e0e0e0] dark:border-[#333] rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-design-content-weak" />
                <span className="text-[14px] text-design-content-weak">Loading customers...</span>
              </div>
            ) : (
              <ShadcnSelect
                value={toInfo.contact_id || ''}
                onValueChange={handleContactSelect}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  hasError && "border-destructive focus:ring-destructive"
                )}>
                  <SelectValue placeholder={contacts.length === 0 ? "No customers yet" : "Select a customer..."} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {formatContactDisplay(contact)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
            )}
            
            {hasError && (
              <p className="text-destructive text-[12px] mt-1">
                {errors.contact_id || errors.toName || 'Please select a customer'}
              </p>
            )}
          </div>

          {/* Create New Customer Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors mt-1"
          >
            <PlusIcon size={12} />
            Create new customer
          </button>

          {/* Project Dropdown - Only show when customer is selected */}
          {selectedContact && (
            <div className="flex flex-col gap-1 pt-3 border-t border-[#e0e0e0] dark:border-[#333]">
              <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Project (optional)
              </Label>
              
              {isLoadingProjects ? (
                <div className="flex items-center gap-2 h-10 px-3 border border-[#e0e0e0] dark:border-[#333] rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-design-content-weak" />
                  <span className="text-[14px] text-design-content-weak">Loading projects...</span>
                </div>
              ) : (
                <ShadcnSelect
                  value={projectId || ''}
                  onValueChange={handleProjectSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={projects.length === 0 ? "No projects yet" : "Select a project..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              )}

              {/* Create New Project Button */}
              {selectedContact && (
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(true)}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors mt-1"
                >
                  <PlusIcon size={12} />
                  Create new project
                </button>
              )}
            </div>
          )}

          {/* Selected Customer Details */}
          {selectedContact && (
            <div className="pt-3 border-t border-[#e0e0e0] dark:border-[#333]">
              <div className="text-[13px] text-design-content-weak space-y-1">
                {selectedContact.vat_number && (
                  <p className="text-[12px] text-design-content-weak">{selectedContact.vat_number}</p>
                )}
                <p className="font-medium text-design-content-default">{selectedContact.company_name || selectedContact.name}</p>
                {selectedContact.address && <p>{selectedContact.address}</p>}
                <p>
                  {[selectedContact.postal_code, selectedContact.city].filter(Boolean).join(' ')}
                </p>
                {selectedContact.email && (
                  <p className="text-[12px]">{selectedContact.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerCreated={handleCustomerCreated}
        supabase={supabase}
        userId={userId}
      />

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <AddProjectModal
          isOpen={showAddProjectModal}
          onClose={() => setShowAddProjectModal(false)}
          onSave={handleProjectCreated}
          isLoading={isCreatingProject}
          initialData={toInfo.contact_id ? {
            id: '',
            user_id: userId,
            contact_id: toInfo.contact_id,
            name: '',
            status: 'active',
            created_at: '',
            updated_at: ''
          } as Project : undefined}
        />
      )}
    </div>
  )
}


