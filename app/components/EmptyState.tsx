'use client'

import React from 'react'
import Link from 'next/link'
import Button from './Button'

interface EmptyStateProps {
  title?: string
  buttonText?: string
  buttonLink?: string
  onButtonClick?: () => void
}

export default function EmptyState({ 
  title = 'No items yet', 
  buttonText = 'Add new', 
  buttonLink = '/',
  onButtonClick
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-[#252525] border border-[#E5E2DB] dark:border-[#333] rounded-[12px] shadow-sm p-6 w-full transition-colors duration-200">
      <h3 className="font-medium text-[20px] text-[#3D3D3D] dark:text-white tracking-[-0.32px] mb-4">
        {title}
      </h3>
      {onButtonClick ? (
        <Button variant="secondary" onClick={onButtonClick}>
          {buttonText}
        </Button>
      ) : (
        <Link href={buttonLink}>
          <Button variant="secondary">
            {buttonText}
          </Button>
        </Link>
      )}
    </div>
  )
}

