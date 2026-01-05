'use client'

import { useClerk } from '@clerk/nextjs'
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

  const handleSignOut = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LogoutButton.tsx:handleSignOut:entry',message:'Sign out button clicked',data:{timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LogoutButton.tsx:handleSignOut:before-signOut',message:'About to call signOut with redirectUrl',data:{redirectUrl:'/'},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // signOut with redirectUrl handles the navigation - no need for router.push
      await signOut({ redirectUrl: '/' })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LogoutButton.tsx:handleSignOut:after-signOut',message:'signOut completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LogoutButton.tsx:handleSignOut:error',message:'signOut threw an error',data:{error:error instanceof Error ? error.message : String(error), stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw error
    }
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


