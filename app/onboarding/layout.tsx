import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function OnboardingLayout({
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
    <div className="min-h-screen bg-design-background">
      {/* Logo in top left corner */}
      <div className="fixed top-4 left-4 z-10">
        <Image
          src="/LOGO.svg"
          alt="Fakturio"
          width={102}
          height={29}
          className="h-8 w-auto"
          priority
        />
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-[600px] flex-col px-4 pt-20 pb-10">
        {children}
      </div>
    </div>
  )
}

