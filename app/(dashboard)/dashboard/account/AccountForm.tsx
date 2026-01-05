'use client'

import { useState } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { updateUserProfileWithClient, type Profile } from '@/lib/services/settingsService.client'

interface AccountFormProps {
  initialProfile: Profile | null
}

export default function AccountForm({ initialProfile }: AccountFormProps) {
  const { session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: initialProfile?.name || '',
    company_name: initialProfile?.company_name || '',
    address: initialProfile?.address || '',
    city: initialProfile?.city || '',
    postal_code: initialProfile?.postal_code || '',
    country: initialProfile?.country || 'Switzerland',
    phone: initialProfile?.phone || '',
    vat_number: initialProfile?.vat_number || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await updateUserProfileWithClient(supabase, userId, {
        ...formData,
        email: session.user.primaryEmailAddress?.emailAddress || initialProfile?.email || '',
      })

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          Your Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., John Doe"
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
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., Acme GmbH"
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
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., Bahnhofstrasse 1"
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
            className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
            placeholder="e.g., 8001"
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
            className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
            placeholder="e.g., Zürich"
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
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., Switzerland"
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
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., +41 44 123 45 67"
        />
      </div>

      {/* VAT Number */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          VAT Number (optional)
        </label>
        <input
          type="text"
          name="vat_number"
          value={formData.vat_number}
          onChange={handleChange}
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., CHE-123.456.789"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-[13px] text-green-600 dark:text-green-400">Profile saved successfully!</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center px-5 py-2.5 h-[44px] bg-design-button-primary text-design-on-button-content rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  )
}

