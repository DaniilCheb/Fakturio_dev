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
  className?: string
  variant?: 'default' | 'minimal'
}

export default function EmptyState({ 
  title = 'No items yet', 
  description,
  icon: Icon,
  buttonText, 
  buttonLink,
  onButtonClick,
  className = '',
  variant = 'default'
}: EmptyStateProps) {
  const isMinimal = variant === 'minimal'

  return (
    <div className={`flex flex-col items-center justify-center text-center w-full transition-colors duration-200 ${
      isMinimal ? 'py-4 px-2 border border-[#E5E2DB] dark:border-[#333] rounded-[12px]' : 'py-6 px-4 bg-white dark:bg-[#252525] border border-[#E5E2DB] dark:border-[#333] rounded-[12px] shadow-sm'
    } ${className}`}>
      {Icon && (
        <Icon className={`text-design-content-weakest mb-2 ${isMinimal ? 'w-4 h-4' : 'w-5 h-5'}`} />
      )}
      <h3 className={`font-medium text-[#3D3D3D] dark:text-white tracking-[-0.2px] ${isMinimal ? 'text-[14px]' : 'text-[15px]'}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-1 text-design-content-weak max-w-[280px] ${isMinimal ? 'text-[12px]' : 'text-[13px]'}`}>
          {description}
        </p>
      )}
      {(buttonText && (buttonLink || onButtonClick)) && (
        <div className={isMinimal ? 'mt-2' : 'mt-4'}>
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
