'use client'

import React from 'react'
import Image from 'next/image'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
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
      {/* Desktop Sidebar */}
      <div className="fixed bg-white dark:bg-[#1f1f1f] border border-[#e0e0e0] dark:border-[#333] left-4 top-4 bottom-4 w-[260px] hidden lg:flex flex-col transition-colors duration-200 overflow-hidden rounded-2xl shadow-sm">
        <div className="flex flex-col h-full p-6 relative z-10">
          {/* Logo at top */}
          <div className="flex-shrink-0 mb-6">
            <div className="inline-flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded flex items-center justify-center">
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-[#141414] rounded-tl"></div>
                  <div className="bg-[#141414] rounded-tr"></div>
                  <div className="bg-[#141414] rounded-bl"></div>
                  <div className="bg-[#141414] rounded-br"></div>
                </div>
              </div>
              <span className="text-[18px] font-semibold text-[#141414] dark:text-white">Fakturio</span>
            </div>
          </div>
          
          {/* Text + Buttons in middle */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex flex-col gap-6">
              <p className="text-[15px] text-[#141414] dark:text-white leading-relaxed">
                Fakturio is the fastest way for Swiss freelancers to create invoices, track expenses, and stay tax-ready without the accounting headache.
              </p>
              <div className="flex flex-col gap-3">
                <SignUpButton mode="modal">
                  <Button variant="primary" className="w-full justify-center">
                    Create free account
                  </Button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <Button variant="secondary" className="w-full justify-center">
                    Log in
                  </Button>
                </SignInButton>
              </div>
            </div>
          </div>
          
          {/* Made in Switzerland at bottom */}
          <div className="flex-shrink-0">
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
              <span className="text-[12px] text-[#666666] dark:text-[#999] uppercase tracking-wide">
                MADE IN SWITZERLAND
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

