'use client'

import { useState, useEffect } from 'react'
import Modal, { ModalBody, ModalFooter } from '@/app/components/Modal'
import Button from '@/app/components/Button'
import { type Contact, type CreateContactInput } from '@/lib/services/contactService.client'

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateContactInput) => Promise<void>
  isLoading: boolean
  initialData?: Contact
  isEditing?: boolean
}

export default function AddCustomerModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
  initialData,
  isEditing = false
}: AddCustomerModalProps) {
  const [formData, setFormData] = useState<CreateContactInput>({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Switzerland',
    vat_number: '',
    notes: '',
  })

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        company_name: initialData.company_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        postal_code: initialData.postal_code || '',
        country: initialData.country || 'Switzerland',
        vat_number: initialData.vat_number || '',
        notes: initialData.notes || '',
      })
    } else if (isOpen && !initialData) {
      setFormData({
        name: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Switzerland',
        vat_number: '',
        notes: '',
      })
    }
  }, [isOpen, initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Edit Customer' : 'Add Customer'}
    >
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="John Doe"
            />
          </div>

          {/* Company Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Company Name
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="Acme GmbH"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="john@example.com"
            />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="+41 44 123 45 67"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Street Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="Bahnhofstrasse 1"
            />
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-design-content-weak">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                placeholder="8001"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-design-content-weak">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
                placeholder="Zürich"
              />
            </div>
          </div>

          {/* Country */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="Switzerland"
            />
          </div>

          {/* VAT Number */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              VAT Number / UID
            </label>
            <input
              type="text"
              name="vat_number"
              value={formData.vat_number}
              onChange={handleChange}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="CHE-123.456.789"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:border-design-content-default transition-colors resize-none"
              placeholder="Additional notes..."
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !formData.name}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {isEditing ? 'Saving...' : 'Adding...'}
              </>
            ) : (
              isEditing ? 'Save Changes' : 'Add Customer'
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
