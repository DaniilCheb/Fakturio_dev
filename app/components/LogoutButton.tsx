'use client'

import { useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Button from './Button'

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
)

export default function LogoutButton() {
  const { signOut } = useClerk()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' })
    router.push('/')
  }

  return (
    <Button
      variant="outline"
      onClick={handleSignOut}
      className="w-full justify-center gap-2"
    >
      <SignOutIcon />
      Sign Out
    </Button>
  )
}


