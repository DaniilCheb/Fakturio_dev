'use client'

import React from 'react'
import Link from 'next/link'
import Button from './Button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: LucideIcon
  buttonText?: string
  buttonLink?: string
  onButtonClick?: () => void
}

export default function EmptyState({ 
  title = 'No items yet', 
  description,
  icon: Icon,
  buttonText, 
  buttonLink,
  onButtonClick
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-white dark:bg-[#252525] border border-[#E5E2DB] dark:border-[#333] rounded-[12px] shadow-sm w-full transition-colors duration-200">
      {Icon && (
        <Icon className="w-5 h-5 text-design-content-weakest mb-2" />
      )}
      <h3 className="font-medium text-[15px] text-[#3D3D3D] dark:text-white tracking-[-0.2px]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-[13px] text-design-content-weak max-w-[280px]">
          {description}
        </p>
      )}
      {(buttonText && (buttonLink || onButtonClick)) && (
        <div className="mt-4">
          {onButtonClick ? (
            <Button variant="secondary" size="sm" onClick={onButtonClick}>
              {buttonText}
            </Button>
          ) : (
            <Link href={buttonLink || '#'}>
              <Button variant="secondary" size="sm">
                {buttonText}
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
