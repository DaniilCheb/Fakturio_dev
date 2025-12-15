'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSession, useUser } from '@clerk/nextjs'
import { createClientSupabaseClient } from '@/lib/supabase-client'
import { getContactsWithClient } from '@/lib/services/contactService.client'
import { getProjectsWithClient } from '@/lib/services/projectService.client'
import { getBankAccountsWithClient } from '@/lib/services/bankAccountService.client'

/**
 * Component that prefetches secondary data immediately after authentication.
 * Invoices and expenses are now fetched server-side in the dashboard layout.
 * This ensures secondary data is cached before the user navigates to pages that need it.
 */
export default function DataPrefetcher() {
  const queryClient = useQueryClient()
  const { session, isLoaded } = useSession()
  const { user } = useUser()

  useEffect(() => {
    async function prefetchData() {
      if (!isLoaded || !session || !user) return

      const supabase = createClientSupabaseClient(session)

      // Prefetch secondary data in parallel
      // Invoices and expenses are now server-fetched in the dashboard layout
      await Promise.all([
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

