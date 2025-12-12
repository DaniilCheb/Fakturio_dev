'use client'

import React from 'react'
import TextArea from '../TextArea'

interface DescriptionSectionProps {
  description: string
  onChange: (description: string) => void
}

export default function DescriptionSection({ description, onChange }: DescriptionSectionProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        Description
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <TextArea
          value={description || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add a note or description for this invoice..."
          rows={4}
          noLabel
        />
      </div>
    </div>
  )
}
