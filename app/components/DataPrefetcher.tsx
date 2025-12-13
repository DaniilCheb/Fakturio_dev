'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { getInvoicesWithClient } from '@/lib/services/invoiceService.client'
import { getContactsWithClient } from '@/lib/services/contactService.client'
import { getProjectsWithClient } from '@/lib/services/projectService.client'
import { getBankAccountsWithClient } from '@/lib/services/bankAccountService.client'

/**
 * Component that prefetches all core data immediately after authentication.
 * This ensures data is cached before the user navigates to any page.
 */
export default function DataPrefetcher() {
  const queryClient = useQueryClient()
  const { session, isLoaded } = useSession()
  const { user } = useUser()

  useEffect(() => {
    async function prefetchData() {
      if (!isLoaded || !session || !user) return

      const supabase = createClientSupabaseClient(session)

      // Prefetch all core data in parallel
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: ['invoices', user.id],
          queryFn: () => getInvoicesWithClient(supabase, user.id),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['contacts', user.id],
          queryFn: () => getContactsWithClient(supabase, user.id),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['projects', user.id],
          queryFn: () => getProjectsWithClient(supabase, user.id),
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ['bankAccounts', user.id],
          queryFn: () => getBankAccountsWithClient(supabase, user.id),
          staleTime: 5 * 60 * 1000,
        }),
      ])
    }

    prefetchData()
  }, [isLoaded, session, user, queryClient])

  return null // This component doesn't render anything
}

