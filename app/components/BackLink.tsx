'use client'

import React from 'react'
import Link from 'next/link'
import { BackIcon } from './Icons'

interface BackLinkProps {
  to: string
  label: string
}

/**
 * Standard back navigation link for detail and form pages
 * 
 * Usage:
 * <BackLink to="/dashboard" label="Dashboard" />
 */
export default function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link 
      href={to} 
      className="flex items-center gap-2 text-[14px] text-[#666666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white transition-colors w-fit"
    >
      <BackIcon />
      {label}
    </Link>
  )
}

