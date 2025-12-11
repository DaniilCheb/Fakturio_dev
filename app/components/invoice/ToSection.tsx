'use client'

import React from 'react'
import Input from '../Input'
import { ToInfo } from '@/lib/types/invoice'

interface ToSectionProps {
  toInfo: ToInfo
  onChange: (toInfo: ToInfo) => void
  errors?: {
    toName?: string
    toAddress?: string
    toZip?: string
  }
}

export default function ToSection({ toInfo, onChange, errors = {} }: ToSectionProps) {
  const handleChange = (field: keyof ToInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...toInfo,
      [field]: e.target.value
    })
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h3 className="font-medium text-[15px] text-[#141414] dark:text-white">To</h3>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-xl shadow-sm overflow-hidden transition-colors duration-200">
        <div className="p-4 flex flex-col gap-4">
          <Input
            label="UID"
            value={toInfo.uid || ''}
            onChange={handleChange('uid')}
            placeholder="CHE-123.456.789"
          />
          <Input
            label="Name"
            value={toInfo.name || ''}
            onChange={handleChange('name')}
            placeholder="Company AG"
            error={errors.toName}
            required
          />
          <Input
            label="Address"
            value={toInfo.address || ''}
            onChange={handleChange('address')}
            placeholder="Bucheggstrasse 21"
            error={errors.toAddress}
            required
          />
          <Input
            label="ZIP / City"
            value={toInfo.zip || ''}
            onChange={handleChange('zip')}
            placeholder="8037 Zurich"
            error={errors.toZip}
            required
          />
        </div>
      </div>
    </div>
  )
}

