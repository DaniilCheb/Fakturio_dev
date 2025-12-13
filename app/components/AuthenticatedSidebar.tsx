'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

// Icons for navigation
const InvoicesIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 3C4 2.44772 4.44772 2 5 2H15C15.5523 2 16 2.44772 16 3V17C16 17.5523 15.5523 18 15 18H5C4.44772 18 4 17.5523 4 17V3Z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 6H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 9H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 12H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const AccountIcon = ({ className }: { className?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 16C4 13.7909 5.79086 12 8 12H12C14.2091 12 16 13.7909 16 16V17H4V16Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
        ${isActive 
          ? 'bg-design-surface-field text-design-content-default font-medium' 
          : 'text-design-content-weak hover:bg-design-surface-field hover:text-design-content-default'
        }
      `}
    >
      {icon}
      <span className="text-[14px]">{label}</span>
    </Link>
  )
}

export default function AuthenticatedSidebar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/dashboard', icon: <InvoicesIcon />, label: 'Invoices' },
    { href: '/dashboard/account', icon: <AccountIcon />, label: 'Account' },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Header */}
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
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-design-content-default hover:bg-design-surface-field rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div className={`
        fixed top-16 left-0 right-0 bg-design-surface-default border-b border-design-border-default z-40 lg:hidden
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}
      `}>
        <nav className="p-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              isActive={isActive(item.href)}
              onClick={() => setMobileMenuOpen(false)}
            />
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="fixed bg-design-surface-default border border-design-border-default left-4 top-4 bottom-4 w-[260px] hidden lg:flex flex-col transition-colors duration-200 overflow-hidden rounded-2xl shadow-sm">
        <div className="flex flex-col h-full p-6 relative z-10">
          {/* Logo at top */}
          <div className="flex-shrink-0 mb-8">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
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
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
              />
            ))}
          </nav>
          
          {/* User section at bottom */}
          <div className="flex-shrink-0 pt-6 border-t border-design-border-default">
            <div className="flex items-center gap-3">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-design-content-weak truncate">
                  My Account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

