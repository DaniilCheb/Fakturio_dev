'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { saveBankAccountWithClient, getBankAccountsWithClient } from '@/lib/services/bankAccountService.client'
import { validateIBAN } from '@/lib/utils/invoiceValidation'
import { getGuestCacheData } from '@/lib/services/guestCacheService'
import Input from '@/app/components/Input'
import Button from '@/app/components/Button'
import { Loader2 } from 'lucide-react'

interface ValidationErrors {
  iban?: string
}

export default function OnboardingStep4Page() {
  const router = useRouter()
  const { session } = useSession()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    account_name: '',
    iban: '',
  })
  
  // Track which fields were pre-filled
  const [prefilledFields, setPrefilledFields] = useState<Set<string>>(new Set())
  
  // Validation errors
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Load guest data on mount
  useEffect(() => {
    async function loadInitialData() {
      if (!session || !user) {
        setIsLoading(false)
        return
      }

      try {
        // Check for guest cache data
        const guestData = getGuestCacheData()
        
        if (guestData.bank) {
          const initialData = {
            account_name: guestData.bank.account_name || '',
            iban: guestData.bank.iban || '',
          }
          
          setFormData(initialData)
          
          // Track pre-filled fields
          const prefilled = new Set<string>()
          if (guestData.bank.account_name) prefilled.add('account_name')
          if (guestData.bank.iban) prefilled.add('iban')
          setPrefilledFields(prefilled)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [session, user])

  // Format IBAN with spaces every 4 characters
  const formatIBAN = (value: string): string => {
    // Remove all spaces first
    const cleaned = value.replace(/\s/g, '').toUpperCase()
    
    // Add space every 4 characters
    return cleaned.replace(/(.{4})/g, '$1 ').trim()
  }

  // Handle IBAN input with auto-formatting
  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow alphanumeric and spaces, but normalize
    const cleaned = value.replace(/[^A-Z0-9\s]/gi, '')
    const formatted = formatIBAN(cleaned)
    
    setFormData(prev => ({ ...prev, iban: formatted }))
    
    // Clear error when user types
    if (errors.iban) {
      setErrors(prev => ({ ...prev, iban: undefined }))
    }
  }

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, account_name: e.target.value }))
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}
    
    // Only validate IBAN if it's provided
    if (formData.iban.trim()) {
      const ibanValidation = validateIBAN(formData.iban)
      if (!ibanValidation.valid) {
        newErrors.iban = ibanValidation.error || 'Please enter a valid IBAN'
      }
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(newErrors)[0]
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`)
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        errorElement.querySelector('input')?.focus()
      }
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If IBAN is provided, validate it
    if (formData.iban.trim() && !validateForm()) {
      return
    }
    
    if (!session || !user) {
      setError('Session expired. Please sign in again.')
      return
    }

    // If no IBAN provided, skip to dashboard
    if (!formData.iban.trim()) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:145',message:'No IBAN provided, using full page navigation to dashboard',data:{userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'AA'})}).catch(()=>{});
      // #endregion
      window.location.href = '/dashboard'
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      
      // Check if user already has bank accounts
      const existingAccounts = await getBankAccountsWithClient(supabase, user.id)
      const isFirstAccount = existingAccounts.length === 0
      
      // Normalize IBAN (remove spaces)
      const normalizedIban = formData.iban.replace(/\s/g, '').toUpperCase()
      
      await saveBankAccountWithClient(supabase, user.id, {
        name: formData.account_name.trim() || 'Main Account',
        iban: normalizedIban,
        is_default: isFirstAccount, // First account is default
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:165',message:'Bank account saved, verifying profile before navigation',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'S'})}).catch(()=>{});
      // #endregion
      
      // Verify profile is complete before navigating to dashboard
      // Use a fresh query with cache-busting to ensure we get the latest data
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("name, address, postal_code, city")
        .eq("id", user.id)
        .maybeSingle();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:173',message:'Profile check before dashboard navigation',data:{hasProfile:!!profileCheck,profileName:profileCheck?.name,profileAddress:profileCheck?.address,profilePostalCode:profileCheck?.postal_code,profileCity:profileCheck?.city,isComplete:!!(profileCheck?.name && profileCheck?.address && profileCheck?.postal_code && profileCheck?.city)},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'T'})}).catch(()=>{});
      // #endregion
      
      if (!profileCheck || !profileCheck.name || !profileCheck.address || !profileCheck.postal_code || !profileCheck.city) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:182',message:'Profile incomplete, redirecting to step-3',data:{hasProfile:!!profileCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'AC'})}).catch(()=>{});
        // #endregion
        router.push('/onboarding/step-3')
        return
      }
      
      // Small delay to ensure database transaction is fully committed
      // This helps with eventual consistency in distributed systems
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Navigate to dashboard using full page reload to ensure middleware sees updated profile
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:191',message:'Using full page navigation to dashboard after delay',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'Y'})}).catch(()=>{});
      // #endregion
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Error saving bank account:', error)
      setError(error.message || 'Failed to save bank account. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = async () => {
    if (!session || !user) {
      setError('Session expired. Please sign in again.')
      return
    }

    try {
      const supabase = createClientSupabaseClient(session)
      
      // Verify profile is complete before navigating
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("name, address, postal_code, city")
        .eq("id", user.id)
        .maybeSingle();
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:197',message:'Skip: Profile check before dashboard navigation',data:{hasProfile:!!profileCheck,profileName:profileCheck?.name,profileAddress:profileCheck?.address,profilePostalCode:profileCheck?.postal_code,profileCity:profileCheck?.city,isComplete:!!(profileCheck?.name && profileCheck?.address && profileCheck?.postal_code && profileCheck?.city)},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'AD'})}).catch(()=>{});
      // #endregion
      
      if (!profileCheck || !profileCheck.name || !profileCheck.address || !profileCheck.postal_code || !profileCheck.city) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:206',message:'Skip: Profile incomplete, redirecting to step-3',data:{hasProfile:!!profileCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'AE'})}).catch(()=>{});
        // #endregion
        router.push('/onboarding/step-3')
        return
      }
      
      // Small delay to ensure database transaction is fully committed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'onboarding/step-4/page.tsx:214',message:'Skip: Using full page navigation to dashboard after delay',data:{userId:user.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'Z'})}).catch(()=>{});
      // #endregion
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Error in handleSkip:', error)
      setError('Failed to navigate. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-design-content-weak" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 bg-design-border-default rounded-full overflow-hidden">
            <div className="h-full bg-design-button-primary rounded-full" style={{ width: '100%' }} />
          </div>
          <span className="text-[12px] text-design-content-weak">Step 2 of 2</span>
        </div>
        <h1 className="text-[32px] font-semibold text-design-content-default tracking-[-0.512px]">
          Add bank details
        </h1>
        <p className="text-[16px] text-design-content-weak mt-2 tracking-[-0.256px]">
          Where do you want to receive the payouts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-[33px]">
        <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-5 flex flex-col gap-5">
        {/* Account Name */}
        <Input
          label="Bank account name (optional)"
          name="account_name"
          value={formData.account_name}
          onChange={handleAccountNameChange}
          placeholder="e.g., Main"
          fieldName="account_name"
        />
        
        {formData.iban && !formData.account_name && (
          <p className="text-[12px] text-design-content-weak -mt-3">
            Tip: Adding a name helps you identify this account later.
          </p>
        )}

        {/* IBAN */}
        <Input
          label="IBAN (optional)"
          name="iban"
          value={formData.iban}
          onChange={handleIbanChange}
          placeholder="e.g., CH93 0076 2011 6238 5295 7"
          error={errors.iban}
          fieldName="iban"
          onErrorClear={() => setErrors(prev => ({ ...prev, iban: undefined }))}
        />
        
        {formData.iban && errors.iban && (
          <p className="text-[12px] text-design-content-weak -mt-3">
            BIC/SWIFT is not required. Payment providers can derive it from your IBAN.
          </p>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-[13px] text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}
        </div>

        {/* Action buttons - outside card, side-by-side, right-aligned */}
        <div className="flex gap-2 items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={handleSkip}
            disabled={isSaving}
            className="w-auto"
          >
            I'll add this later
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            size="default"
            disabled={isSaving}
            className="w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

