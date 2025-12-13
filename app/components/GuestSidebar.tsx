'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from './Button'

const SwissFlag = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" rx="2" fill="#FF0000"/>
    <path d="M7 4H9V7H12V9H9V12H7V9H4V7H7V4Z" fill="white"/>
  </svg>
)

export default function GuestSidebar() {
  return (
    <>
      {/* Mobile Header - Only visible on small screens */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-design-surface-default border-b border-design-border-default z-50 lg:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <div className="inline-flex items-center gap-2">
            <Image
              src="/logo-dark.svg"
              alt="Fakturio"
              width={102}
              height={29}
              className="h-8 w-auto dark:hidden"
              priority
            />
            <Image
              src="/logo-dark-mode.svg"
              alt="Fakturio"
              width={102}
              height={29}
              className="h-8 w-auto hidden dark:block"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-up">
              <Button variant="primary" className="text-sm px-3 py-1.5 h-auto">Create free account</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="fixed bg-design-surface-default border border-design-border-default left-4 top-4 bottom-4 w-[260px] hidden lg:flex flex-col transition-colors duration-200 overflow-hidden rounded-2xl shadow-sm">
        <div className="flex flex-col h-full p-6 relative z-10">
          {/* Logo at top */}
          <div className="flex-shrink-0 mb-6">
            <div className="inline-flex items-center gap-2">
              <Image
                src="/logo-dark.svg"
                alt="Fakturio"
                width={102}
                height={29}
                className="h-8 w-auto dark:hidden"
                priority
              />
              <Image
                src="/logo-dark-mode.svg"
                alt="Fakturio"
                width={102}
                height={29}
                className="h-8 w-auto hidden dark:block"
                priority
              />
            </div>
          </div>
          
          {/* Text + Buttons in middle */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-col gap-6">
              {/* Desktop hero */}
              <h1 className="text-[24px] leading-[30px] font-semibold text-design-content-default tracking-[-0.4px]">
                Simple invoicing and expense tracking for Swiss freelancers
              </h1>
              <p className="text-[15px] text-design-content-weak leading-relaxed" style={{ fontWeight: 400 }}>
                Create beautiful QR invoices, collect deductible expenses, have an overview of what your taxes will look like, and share everything easily with your accountant.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/sign-up">
                  <Button variant="primary" className="w-full justify-center">
                    Create free account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Made in Switzerland at bottom */}
          <div className="flex-shrink-0">
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
              <span className="text-[12px] text-design-content-weak uppercase tracking-wide">
                MADE IN SWITZERLAND
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

