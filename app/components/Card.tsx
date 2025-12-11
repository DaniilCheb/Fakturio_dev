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
    <div className={`bg-design-surface-default border border-design-border-default rounded-xl shadow-sm transition-colors duration-200 ${className}`}>
      {title && (
        <div className="px-4 md:px-6 py-3 bg-design-surface-field border-b border-design-border-default rounded-t-xl">
          <p className="text-[13px] font-medium text-design-content-weak uppercase tracking-wide">{title}</p>
        </div>
      )}
      {noPadding ? children : <div className="p-4 md:p-6">{children}</div>}
    </div>
  )
}

