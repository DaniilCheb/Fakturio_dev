import { getUserProfileWithClient, getVatSettingsWithClient, type VatSettings } from '@/lib/services/settingsService'
import { getBankAccountsWithClient } from '@/lib/services/bankAccountService'
import { createServerSupabaseClient, getCurrentUserId } from '@/lib/supabase-server'
import { PricingTable } from '@clerk/nextjs'
import AccountForm from './AccountForm'
import BankAccountsSection from './BankAccountsSection'
import VATSettingsForm from './VATSettingsForm'
import PricingTableStyler from './PricingTableStyler'
import LogoutButton from '@/app/components/LogoutButton'
import SectionHeader from '@/app/components/SectionHeader'

export default async function AccountPage() {
  let profile = null
  let bankAccounts: Awaited<ReturnType<typeof getBankAccountsWithClient>> = []
  let vatSettings: VatSettings | null = null
  let error: string | null = null

  try {
    // Parallelize client creation and user ID fetch
    const [supabase, userId] = await Promise.all([
      createServerSupabaseClient(),
      getCurrentUserId(),
    ])

    // Run all queries in parallel with shared client
    const [profileResult, bankAccountsResult, vatSettingsResult] = await Promise.all([
      getUserProfileWithClient(supabase, userId).catch(() => null),
      getBankAccountsWithClient(supabase, userId).catch(() => []),
      getVatSettingsWithClient(supabase, userId).catch(() => null),
    ])

    profile = profileResult
    bankAccounts = bankAccountsResult
    vatSettings = vatSettingsResult
    // If we successfully got empty data, that's fine - user just hasn't set up their account yet
  } catch (e) {
    // For new users who haven't set up their account yet, treat as empty state rather than error
    // This provides better UX - showing an error when a user simply hasn't configured their account yet
    // is confusing. We'll log the error for debugging but show empty state to the user.
    console.error('Error fetching account data (showing empty state):', e)
    error = null // Don't show error to user - treat as empty state
    profile = null // Ensure profile is null
    bankAccounts = [] // Ensure bankAccounts is empty array
    vatSettings = null // Ensure vatSettings is null
  }

  return (
    <div className="max-w-[920px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[32px] font-semibold text-design-content-default tracking-tight">
          Account
        </h1>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl mb-6 overflow-hidden">
        <SectionHeader title="Business Information" />
        <div className="p-6">
          <AccountForm initialProfile={profile} />
        </div>
      </div>

      {/* Bank Accounts */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl mb-6 overflow-hidden">
        <SectionHeader title="Bank Accounts" />
        <div className="p-6">
          <BankAccountsSection initialBankAccounts={bankAccounts} />
        </div>
      </div>

      {/* VAT Settings */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl mb-6 overflow-hidden">
        <SectionHeader title="VAT Settings" />
        <div className="p-6">
          <VATSettingsForm initialVatSettings={vatSettings} />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl mb-6 overflow-hidden">
        <SectionHeader title="Pricing" />
        <div className="p-6">
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <PricingTableStyler>
              <PricingTable
                appearance={{
                  elements: {
                    card: 'shadow-none border border-design-border-default rounded-xl bg-transparent',
                    cardBox: 'shadow-none bg-transparent',
                    rootBox: 'shadow-none bg-transparent',
                    button: 'bg-[#141414] text-white hover:bg-[#333333] active:bg-[#000000] rounded-full px-5 py-2.5 h-[44px] text-[14px] font-medium',
                  },
                }}
              />
            </PricingTableStyler>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <LogoutButton />
    </div>
  )
}

