'use client'

import React, { useEffect, useState } from 'react'
import Input from '../Input'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { getUserProfileWithClient, Profile } from '@/lib/services/settingsService.client'
import { getDefaultBankAccountWithClient, BankAccount } from '@/lib/services/bankAccountService.client'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export interface AuthFromInfo {
  name: string
  street: string
  zip: string
  city?: string
  iban: string
  logo_url?: string
  company_name?: string
  uid?: string
}

interface AuthFromSectionProps {
  fromInfo: AuthFromInfo
  onChange: (fromInfo: AuthFromInfo) => void
  errors?: {
    fromName?: string
    fromStreet?: string
    fromZip?: string
    fromCity?: string
    fromIban?: string
  }
  onClearError?: (field: string) => void
  onProfileLoaded?: (profile: Profile | null, bankAccount: BankAccount | null) => void
}

export default function AuthFromSection({ 
  fromInfo, 
  onChange, 
  errors = {}, 
  onClearError,
  onProfileLoaded 
}: AuthFromSectionProps) {
  const { session } = useSession()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [hasBankAccount, setHasBankAccount] = useState(false)

  // Load profile and bank account on mount
  useEffect(() => {
    async function loadProfileData() {
      if (!session || !user) {
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClientSupabaseClient(session)
        
        // Fetch profile and bank account in parallel
        const [profile, bankAccount] = await Promise.all([
          getUserProfileWithClient(supabase, user.id).catch(() => null),
          getDefaultBankAccountWithClient(supabase, user.id).catch(() => null)
        ])

        setHasProfile(!!profile)
        setHasBankAccount(!!bankAccount)

        // Pre-fill the form with profile data
        const newFromInfo: AuthFromInfo = {
          name: profile?.name || '',
          street: profile?.address || '',
          zip: profile?.postal_code || '',
          city: profile?.city || '',
          iban: bankAccount?.iban || '',
          logo_url: profile?.logo_url,
          company_name: profile?.company_name,
          uid: profile?.vat_number || undefined
        }

        onChange(newFromInfo)
        onProfileLoaded?.(profile, bankAccount)
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [session, user]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (field: keyof AuthFromInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...fromInfo,
      [field]: e.target.value
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
          From
        </h2>
        <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-design-content-weak" />
            <span className="ml-2 text-[14px] text-design-content-weak">Loading profile...</span>
          </div>
        </div>
      </div>
    )
  }

  // Show setup prompt if profile or bank account is missing
  const needsSetup = !hasProfile || !hasBankAccount

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        From
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        {needsSetup && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-[13px] text-yellow-700 dark:text-yellow-400">
              {!hasProfile && !hasBankAccount && (
                <>Complete your <Link href="/dashboard/account" className="underline font-medium">account settings</Link> to auto-fill your details.</>
              )}
              {hasProfile && !hasBankAccount && (
                <>Add a <Link href="/dashboard/account" className="underline font-medium">bank account</Link> to auto-fill your IBAN.</>
              )}
              {!hasProfile && hasBankAccount && (
                <>Complete your <Link href="/dashboard/account" className="underline font-medium">profile</Link> to auto-fill your details.</>
              )}
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-5">
          {fromInfo.company_name && (
            <div className="text-[14px] text-design-content-weak">
              <span className="font-medium text-design-content-default">{fromInfo.company_name}</span>
            </div>
          )}
          
          <Input
            label="Your name"
            value={fromInfo.name || ''}
            onChange={handleChange('name')}
            placeholder="Name"
            error={errors.fromName}
            required
            onErrorClear={() => onClearError?.('fromName')}
            fieldName="fromName"
          />
          <Input
            label="Street"
            value={fromInfo.street || ''}
            onChange={handleChange('street')}
            placeholder="Street"
            error={errors.fromStreet}
            required
            onErrorClear={() => onClearError?.('fromStreet')}
            fieldName="fromStreet"
          />
          <Input
            label="UID/VAT number"
            value={fromInfo.uid || ''}
            onChange={handleChange('uid')}
            placeholder="CHE-123.456.789"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ZIP"
              value={fromInfo.zip || ''}
              onChange={handleChange('zip')}
              placeholder="8001"
              error={errors.fromZip}
              required
              onErrorClear={() => onClearError?.('fromZip')}
              fieldName="fromZip"
            />
            <Input
              label="City"
              value={fromInfo.city || ''}
              onChange={handleChange('city')}
              placeholder="Zurich"
              error={errors.fromCity}
              required
              onErrorClear={() => onClearError?.('fromCity')}
              fieldName="fromCity"
            />
          </div>
          <Input
            label="Your IBAN"
            value={fromInfo.iban || ''}
            onChange={handleChange('iban')}
            placeholder="CH93 0076 2011 6238 5295 7"
            error={errors.fromIban}
            onErrorClear={() => onClearError?.('fromIban')}
            fieldName="fromIban"
          />
        </div>
      </div>
    </div>
  )
}


