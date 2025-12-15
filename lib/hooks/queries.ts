'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { getInvoicesWithClient, getInvoiceByIdWithClient, type Invoice } from '@/lib/services/invoiceService.client'
import { getContactsWithClient, getContactByIdWithClient, type Contact } from '@/lib/services/contactService.client'
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
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['invoices', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getInvoicesWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Use hydrated data from server prefetch immediately, even before session loads
    placeholderData: () => {
      // Try to get data from cache for any user ID (server prefetch might use different key)
      const cachedData = queryClient.getQueryData<Invoice[]>(['invoices', user?.id])
      if (cachedData) return cachedData
      // Also check without user ID (fallback for server-prefetched data)
      const allCached = queryClient.getQueriesData<Invoice[]>({ queryKey: ['invoices'] })
      return allCached[0]?.[1] ?? undefined
    },
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
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getContactsWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000,
    // Use hydrated data from server prefetch immediately
    placeholderData: () => {
      const cachedData = queryClient.getQueryData<Contact[]>(['contacts', user?.id])
      if (cachedData) return cachedData
      const allCached = queryClient.getQueriesData<Contact[]>({ queryKey: ['contacts'] })
      return allCached[0]?.[1] ?? undefined
    },
  })
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContact(contactId: string) {
  const { session } = useSession()
  const { user } = useUser()

  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      if (!session || !user || !contactId) return null
      const supabase = createClientSupabaseClient(session)
      return getContactByIdWithClient(supabase, user.id, contactId)
    },
    enabled: !!session && !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch all projects for the current user
 */
export function useProjects() {
  const { session } = useSession()
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getProjectsWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000,
    // Use hydrated data from server prefetch immediately
    placeholderData: () => {
      const cachedData = queryClient.getQueryData<Project[]>(['projects', user?.id])
      if (cachedData) return cachedData
      const allCached = queryClient.getQueriesData<Project[]>({ queryKey: ['projects'] })
      return allCached[0]?.[1] ?? undefined
    },
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
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['bankAccounts', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getBankAccountsWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000,
    // Use hydrated data from server prefetch immediately
    placeholderData: () => {
      const cachedData = queryClient.getQueryData<BankAccount[]>(['bankAccounts', user?.id])
      if (cachedData) return cachedData
      const allCached = queryClient.getQueriesData<BankAccount[]>({ queryKey: ['bankAccounts'] })
      return allCached[0]?.[1] ?? undefined
    },
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
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!session || !user) return []
      const supabase = createClientSupabaseClient(session)
      return getExpensesWithClient(supabase, user.id)
    },
    enabled: !!session && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Use hydrated data from server prefetch immediately
    placeholderData: () => {
      const cachedData = queryClient.getQueryData<Expense[]>(['expenses', user?.id])
      if (cachedData) return cachedData
      const allCached = queryClient.getQueriesData<Expense[]>({ queryKey: ['expenses'] })
      return allCached[0]?.[1] ?? undefined
    },
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

