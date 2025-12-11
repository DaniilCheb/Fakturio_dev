'use client'

import React from 'react'

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export default function Card({ title, children, className = '', noPadding = false }: CardProps) {
  return (
    <div className={`bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-xl shadow-sm transition-colors duration-200 ${className}`}>
      {title && (
        <div className="px-4 md:px-6 py-3 bg-white dark:bg-[#2a2a2a] border-b border-[#e0e0e0] dark:border-[#333] rounded-t-xl">
          <p className="text-[13px] font-medium text-[#666666] dark:text-[#999] uppercase tracking-wide">{title}</p>
        </div>
      )}
      {noPadding ? children : <div className="p-4 md:p-6">{children}</div>}
    </div>
  )
}

