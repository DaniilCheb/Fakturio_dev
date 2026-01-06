import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import AuthenticatedSidebar from '../components/AuthenticatedSidebar'
import GuestMigrationWrapper from '../components/GuestMigrationWrapper'
import { Toaster } from '@/app/components/ui/sonner'
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

  // Create a new QueryClient with empty initial state
  // Individual pages will handle their own data fetching with Suspense
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  })

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

