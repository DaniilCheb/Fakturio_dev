'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@clerk/nextjs'
import { migrateGuestData, hasGuestData, clearGuestData } from '@/lib/services/guestMigrationService'
import { createClientSupabaseClient } from '@/lib/supabase-client'

interface GuestMigrationWrapperProps {
  children: React.ReactNode
}

export default function GuestMigrationWrapper({ children }: GuestMigrationWrapperProps) {
  const { session, isLoaded } = useSession()
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationComplete, setMigrationComplete] = useState(false)

  useEffect(() => {
    async function handleMigration() {
      if (!isLoaded || !session) {
        console.log('[Migration] Session not ready yet. isLoaded:', isLoaded, 'session:', !!session)
        return
      }
      
      console.log('[Migration] Checking for guest data...')
      const guestDataExists = hasGuestData()
      console.log('[Migration] Guest data exists:', guestDataExists)
      
      // Check if there's guest data to migrate
      if (!guestDataExists) {
        console.log('[Migration] No guest data found, skipping migration')
        setMigrationComplete(true)
        return
      }

      // Check if we've already migrated (prevent duplicate migrations)
      const migrationKey = `fakturio_migrated_${session.user.id}`
      const alreadyMigrated = typeof window !== 'undefined' && localStorage.getItem(migrationKey)
      console.log('[Migration] Already migrated for this user:', alreadyMigrated)
      
      if (alreadyMigrated) {
        clearGuestData()
        setMigrationComplete(true)
        return
      }

      console.log('[Migration] Starting migration process...')
      setIsMigrating(true)

      try {
        console.log('[Migration] Starting migration for user:', session.user.id)
        console.log('[Migration] Guest data found:', hasGuestData())
        
        // Check if Supabase environment variables are configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_KEY) {
          console.error('[Migration] Supabase environment variables not configured. Skipping migration.')
          setMigrationComplete(true)
          return
        }
        
        const supabase = createClientSupabaseClient(session)
        const userId = session.user.id
        const userEmail = session.user.primaryEmailAddress?.emailAddress || ''

        const result = await migrateGuestData(supabase, userId, userEmail)
        console.log('[Migration] Migration complete:', result)
        
        // Mark migration as complete
        if (typeof window !== 'undefined') {
          localStorage.setItem(migrationKey, new Date().toISOString())
        }
        
        // Clear guest data
        clearGuestData()
        
      } catch (error) {
        console.error('[Migration] Error migrating guest data:', error)
        // Don't block the user on migration failure
      } finally {
        setIsMigrating(false)
        setMigrationComplete(true)
      }
    }

    handleMigration()
  }, [isLoaded, session])

  // Show loading state during migration
  if (isMigrating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-design-content-weak border-t-design-content-default rounded-full animate-spin" />
          <p className="text-[14px] text-design-content-weak">
            Setting up your account...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

