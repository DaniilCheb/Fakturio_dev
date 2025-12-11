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
      <h3 className="font-medium text-[15px] text-[#141414] dark:text-white">Description</h3>
      <TextArea
        value={description || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note or description for this invoice..."
        rows={4}
      />
    </div>
  )
}

