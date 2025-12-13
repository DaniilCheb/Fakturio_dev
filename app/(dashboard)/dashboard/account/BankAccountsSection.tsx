'use client'

import { useState } from 'react'
import { useSession } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { 
  saveBankAccountWithClient, 
  deleteBankAccountWithClient, 
  setDefaultBankAccountWithClient,
  type BankAccount 
} from '@/lib/services/bankAccountService.client'

interface BankAccountsSectionProps {
  initialBankAccounts: BankAccount[]
}

export default function BankAccountsSection({ initialBankAccounts }: BankAccountsSectionProps) {
  const { session } = useSession()
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [newAccount, setNewAccount] = useState({
    name: '',
    iban: '',
    bank_name: '',
  })

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      const created = await saveBankAccountWithClient(supabase, userId, {
        name: newAccount.name || 'Main Account',
        iban: newAccount.iban,
        bank_name: newAccount.bank_name || undefined,
        is_default: bankAccounts.length === 0,
      })

      setBankAccounts(prev => [...prev, created])
      setNewAccount({ name: '', iban: '', bank_name: '' })
      setShowAddForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add bank account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!session) return
    if (!confirm('Are you sure you want to delete this bank account?')) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await deleteBankAccountWithClient(supabase, userId, accountId)
      setBankAccounts(prev => prev.filter(a => a.id !== accountId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete bank account')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefault = async (accountId: string) => {
    if (!session) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient(session)
      const userId = session.user.id

      await setDefaultBankAccountWithClient(supabase, userId, accountId)
      setBankAccounts(prev => prev.map(a => ({
        ...a,
        is_default: a.id === accountId
      })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set default account')
    } finally {
      setIsLoading(false)
    }
  }

  // Format IBAN for display
  const formatIban = (iban: string) => {
    return iban.replace(/(.{4})/g, '$1 ').trim()
  }

  return (
    <div className="space-y-4">
      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Bank Accounts List */}
      {bankAccounts.length > 0 ? (
        <div className="space-y-3">
          {bankAccounts.map((account) => (
            <div 
              key={account.id}
              className="flex items-center justify-between p-4 bg-design-surface-field rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-medium text-design-content-default">
                    {account.name}
                  </p>
                  {account.is_default && (
                    <span className="px-2 py-0.5 bg-design-button-primary text-design-on-button-content text-[11px] font-medium rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-design-content-weak font-mono mt-1">
                  {formatIban(account.iban)}
                </p>
                {account.bank_name && (
                  <p className="text-[12px] text-design-content-weakest mt-0.5">
                    {account.bank_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {!account.is_default && (
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    disabled={isLoading}
                    className="text-[13px] text-design-content-weak hover:text-design-content-default transition-colors disabled:opacity-50"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(account.id)}
                  disabled={isLoading}
                  className="text-[13px] text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[14px] text-design-content-weak py-4 text-center">
          No bank accounts added yet.
        </p>
      )}

      {/* Add Account Form */}
      {showAddForm ? (
        <form onSubmit={handleAddAccount} className="space-y-4 pt-4 border-t border-design-border-default">
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Account Name
            </label>
            <input
              type="text"
              value={newAccount.name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-design-content-weakest focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="Main Account"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              IBAN *
            </label>
            <input
              type="text"
              value={newAccount.iban}
              onChange={(e) => setNewAccount(prev => ({ ...prev, iban: e.target.value }))}
              required
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-design-content-weakest focus:outline-none focus:border-design-content-default transition-colors font-mono"
              placeholder="CH93 0076 2011 6238 5295 7"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px] font-medium text-design-content-weak">
              Bank Name (optional)
            </label>
            <input
              type="text"
              value={newAccount.bank_name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, bank_name: e.target.value }))}
              className="w-full h-[40px] px-3 py-2 bg-design-surface-field border border-design-border-default rounded-lg text-[14px] text-design-content-default placeholder:text-design-content-weakest focus:outline-none focus:border-design-content-default transition-colors"
              placeholder="Credit Suisse"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !newAccount.iban}
              className="inline-flex items-center justify-center px-5 py-2 h-[40px] bg-design-button-primary text-design-on-button-content rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add Account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewAccount({ name: '', iban: '', bank_name: '' })
              }}
              className="inline-flex items-center justify-center px-5 py-2 h-[40px] border border-design-border-default text-design-content-default rounded-full text-[14px] font-medium hover:bg-design-surface-field transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center text-[14px] text-design-content-weak hover:text-design-content-default transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mr-2">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Bank Account
        </button>
      )}
    </div>
  )
}

