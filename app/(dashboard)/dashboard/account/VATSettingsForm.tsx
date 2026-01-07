'use client'

import { useState } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { 
  getVatSettingsWithClient, 
  updateVatSettingsWithClient,
  type VatSettings 
} from '@/lib/services/settingsService.client'

interface VATSettingsFormProps {
  initialVatSettings: VatSettings | null
}

export default function VATSettingsForm({ initialVatSettings }: VATSettingsFormProps) {
  const { session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    default_rate: initialVatSettings?.default_rate ?? 8.1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = parseFloat(value)
    
    // Validate that it's a valid number between 0 and 100
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      return
    }
    
    setFormData(prev => ({ ...prev, [name]: numValue }))
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

      await updateVatSettingsWithClient(supabase, userId, {
        default_rate: formData.default_rate,
      })

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save VAT settings')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Default VAT Rate */}
      <div className="flex flex-col gap-1">
        <label className="text-[13px] font-medium text-design-content-weak">
          Default VAT Rate (%)
        </label>
        <input
          type="number"
          name="default_rate"
          value={formData.default_rate}
          onChange={handleChange}
          min="0"
          max="100"
          step="0.1"
          className="w-full h-[40px] px-3 py-2 bg-design-surface-field dark:bg-[#252525] border border-design-border-default rounded-lg text-[14px] text-design-content-default focus:outline-none focus:border-design-content-default transition-colors"
          placeholder="e.g., 8.1"
        />
        <p className="text-[12px] text-design-content-weak mt-1">
          This VAT rate will be used as the default for new invoice items.
        </p>
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
          <p className="text-[13px] text-green-600 dark:text-green-400">VAT settings saved successfully!</p>
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
            'Save VAT Settings'
          )}
        </button>
      </div>
    </form>
  )
}

