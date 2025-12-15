'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { getInvoicesWithClient, getInvoiceByIdWithClient, type Invoice } from '@/lib/services/invoiceService.client'
import { getContactsWithClient, type Contact } from '@/lib/services/contactService.client'
import { getProjectsWithClient, getProjectByIdWithClient, type Project } from '@/lib/services/projectService.client'
import { getBankAccountsWithClient, type BankAccount } from '@/lib/services/bankAccountService.client'
import { getExpensesWithClient, getExpenseByIdWithClient, type Expense } from '@/lib/services/expenseService.client'
import { getUserProfileWithClient, type Profile } from '@/lib/services/settingsService.client'

/**
 * Hook to fetch all invoices for the current user
 */
export function useInvoices() {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getInvoicesWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch a single invoice by ID
 */
export function useInvoice(invoiceId: string) {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!session || !user || !invoiceId) return null
      const supabase = createClientSupabaseClient(session)
      return getInvoiceByIdWithClient(supabase, user.id, invoiceId)
    },
    enabled: !!session && !!user && !!invoiceId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch all contacts for the current user
 */
export function useContacts() {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getContactsWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects() {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getProjectsWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch a single project by ID
 */
export function useProject(projectId: string | null | undefined) {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      if (!session || !user || !projectId) return null
      const supabase = createClientSupabaseClient(session)
      return getProjectByIdWithClient(supabase, user.id, projectId)
    },
    enabled: !!session && !!user && !!projectId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch all bank accounts for the current user
 */
export function useBankAccounts() {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['bankAccounts', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getBankAccountsWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch user profile for the current user
 */
export function useProfile() {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!session || !user) return null
      const supabase = createClientSupabaseClient(session)
      return getUserProfileWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch all expenses for the current user
 */
export function useExpenses() {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getExpensesWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch a single expense by ID
 */
export function useExpense(expenseId: string) {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      if (!session || !user || !expenseId) return null
      const supabase = createClientSupabaseClient(session)
      return getExpenseByIdWithClient(supabase, user.id, expenseId)
    },
    enabled: !!session && !!user && !!expenseId,
    staleTime: 5 * 60 * 1000,
  })
}

