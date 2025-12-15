import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import AuthenticatedSidebar from '../components/AuthenticatedSidebar'
import GuestMigrationWrapper from '../components/GuestMigrationWrapper'
import DataPrefetcher from '../components/DataPrefetcher'
import { Toaster } from '@/app/components/ui/sonner'
import { getInvoices } from '@/lib/services/invoiceService'
import { getExpenses } from '@/lib/services/expenseService'

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

  // Fetch invoices and expenses on the server in parallel
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['invoices', userId],
      queryFn: () => getInvoices(),
    }),
    queryClient.prefetchQuery({
      queryKey: ['expenses', userId],
      queryFn: () => getExpenses(),
    }),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="min-h-screen bg-design-background flex">
        <DataPrefetcher />
        {/* Sidebar */}
        <AuthenticatedSidebar />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-[292px] ml-0 pt-20 lg:pt-8 pb-8 px-4 lg:px-8">
          <GuestMigrationWrapper>
            {children}
          </GuestMigrationWrapper>
        </div>
        <Toaster />
      </div>
    </HydrationBoundary>
  )
}

