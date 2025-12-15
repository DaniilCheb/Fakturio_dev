import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AuthenticatedSidebar from '../components/AuthenticatedSidebar'
import GuestMigrationWrapper from '../components/GuestMigrationWrapper'
import DataPrefetcher from '../components/DataPrefetcher'
import { Toaster } from '@/app/components/ui/sonner'

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

  return (
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
  )
}

