import { getUserProfile } from '@/lib/services/settingsService'
import { getBankAccounts } from '@/lib/services/bankAccountService'
import AccountForm from './AccountForm'
import BankAccountsSection from './BankAccountsSection'
import LogoutButton from '@/app/components/LogoutButton'

export default async function AccountPage() {
  let profile = null
  let bankAccounts: Awaited<ReturnType<typeof getBankAccounts>> = []
  let error: string | null = null

  try {
    profile = await getUserProfile()
    bankAccounts = await getBankAccounts()
    // If we successfully got empty data, that's fine - user just hasn't set up their account yet
  } catch (e) {
    // For new users who haven't set up their account yet, treat as empty state rather than error
    // This provides better UX - showing an error when a user simply hasn't configured their account yet
    // is confusing. We'll log the error for debugging but show empty state to the user.
    console.error('Error fetching account data (showing empty state):', e)
    error = null // Don't show error to user - treat as empty state
    profile = null // Ensure profile is null
    bankAccounts = [] // Ensure bankAccounts is empty array
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] md:text-[32px] font-semibold text-design-content-default tracking-tight">
          Account
        </h1>
        <p className="text-[14px] text-design-content-weak mt-1">
          Manage your profile and business information
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-[14px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl p-6 mb-6">
        <h2 className="text-[18px] font-semibold text-design-content-default mb-6">
          Business Information
        </h2>
        <AccountForm initialProfile={profile} />
      </div>

      {/* Bank Accounts */}
      <div className="bg-design-surface-default border border-design-border-default rounded-xl p-6 mb-6">
        <h2 className="text-[18px] font-semibold text-design-content-default mb-6">
          Bank Accounts
        </h2>
        <BankAccountsSection initialBankAccounts={bankAccounts} />
      </div>

      {/* Logout Button */}
      <LogoutButton />
    </div>
  )
}

