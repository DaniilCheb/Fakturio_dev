import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import AuthenticatedSidebar from '../components/AuthenticatedSidebar'
import GuestMigrationWrapper from '../components/GuestMigrationWrapper'
import { Toaster } from '@/app/components/ui/sonner'
import { getInvoices } from '@/lib/services/invoiceService'
import { getExpenses } from '@/lib/services/expenseService'
import { getContacts } from '@/lib/services/contactService'
import { getProjects } from '@/lib/services/projectService'
import { getBankAccounts } from '@/lib/services/bankAccountService'
import PageLoading from './dashboard/loading'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  
  // Redirect to sign-in if not authenticated
  if (!userId) {
    redirect('/sign-in')
  }

  // Create a new QueryClient for server-side prefetching
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  })

  // Fetch all critical data on the server in parallel
  // This ensures data is available immediately on hydration, eliminating client-side loading delays
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['invoices', userId],
      queryFn: () => getInvoices(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['expenses', userId],
      queryFn: () => getExpenses(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['contacts', userId],
      queryFn: () => getContacts(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['projects', userId],
      queryFn: () => getProjects(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['bankAccounts', userId],
      queryFn: () => getBankAccounts(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen bg-design-background flex">
        {/* Sidebar */}
        <AuthenticatedSidebar />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-[292px] ml-0 pt-20 lg:pt-8 pb-8 px-4 lg:px-8">
          <Suspense fallback={<PageLoading />}>
            <GuestMigrationWrapper>
              {children}
            </GuestMigrationWrapper>
          </Suspense>
        </div>
        <Toaster />
      </div>
    </HydrationBoundary>
  )
}

