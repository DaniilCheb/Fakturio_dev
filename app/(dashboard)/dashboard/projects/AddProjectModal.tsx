'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Modal, { ModalBody, ModalFooter } from '@/app/components/Modal'
import Button from '@/app/components/Button'
import CurrencyPicker from '@/app/components/CurrencyPicker'
import { useContacts } from '@/lib/hooks/queries'
import { type Project, type CreateProjectInput } from '@/lib/services/projectService.client'

interface AddProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateProjectInput) => Promise<void>
  isLoading: boolean
  initialData?: Project
  isEditing?: boolean
}

export default function AddProjectModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData,
  isEditing = false
}: AddProjectModalProps) {
  const { data: contacts = [] } = useContacts()
  const customers = contacts.filter(c => c.type === 'customer')
  
  const [formData, setFormData] = useState<CreateProjectInput>({
    name: '',
    contact_id: '',
    description: '',
    status: 'active',
    hourly_rate: undefined,
    currency: 'CHF',
  })
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        contact_id: initialData.contact_id || '',
        description: initialData.description || '',
        status: initialData.status || 'active',
        hourly_rate: initialData.hourly_rate || undefined,
        currency: initialData.currency || 'CHF',
      })
      setError(null)
    } else if (isOpen && !initialData) {
      setFormData({
        name: '',
        contact_id: '',
        description: '',
        status: 'active',
        hourly_rate: undefined,
        currency: 'CHF',
      })
      setError(null)
    }
  }, [isOpen, initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'hourly_rate') {
      const numValue = value === '' ? undefined : parseFloat(value)
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue as number) ? undefined : numValue }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.contact_id) {
      setError('Please fill in all required fields')
      return
    }
    
    setError(null)
    try {
      await onSave(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Edit Project' : 'New Project'}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Project Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="Website Redesign"
            />
          </div>

          {/* Customer */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Customer *
            </label>
            <select
              name="contact_id"
              value={formData.contact_id}
              onChange={handleChange}
              required
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors cursor-pointer appearance-none"
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
            <label className="text-[13px] font-medium text-design-content-weak">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors cursor-pointer appearance-none"
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
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Hourly Rate (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="hourly_rate"
                value={formData.hourly_rate !== undefined ? formData.hourly_rate.toString() : ''}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="flex-1 h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                placeholder="150.00"
              />
              <div className="w-[140px]">
                <CurrencyPicker
                  noLabel
                  value={formData.currency || 'CHF'}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, currency: value }))
                    if (error) setError(null)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors resize-none"
              placeholder="Project description..."
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !formData.name || !formData.contact_id}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {isEditing ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Save Changes' : 'Create Project'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
