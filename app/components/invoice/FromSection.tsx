'use client'

import React from 'react'
import Input from '../Input'
import { FromInfo } from '@/lib/types/invoice'

interface FromSectionProps {
  fromInfo: FromInfo
  onChange: (fromInfo: FromInfo) => void
  errors?: {
    fromName?: string
    fromStreet?: string
    fromZip?: string
    fromIban?: string
  }
}

export default function FromSection({ fromInfo, onChange, errors = {} }: FromSectionProps) {
  const handleChange = (field: keyof FromInfo) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...fromInfo,
      [field]: e.target.value
    })
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        From
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-5">
        <div className="flex flex-col gap-5">
          <Input
            label="Your name"
            value={fromInfo.name || ''}
            onChange={handleChange('name')}
            placeholder="Name"
            error={errors.fromName}
            required
          />
          <Input
            label="Street"
            value={fromInfo.street || ''}
            onChange={handleChange('street')}
            placeholder="Street"
            error={errors.fromStreet}
            required
          />
          <Input
            label="ZIP / City"
            value={fromInfo.zip || ''}
            onChange={handleChange('zip')}
            placeholder="8037 Zurich"
            error={errors.fromZip}
            required
          />
          <Input
            label="IBAN"
            value={fromInfo.iban || ''}
            onChange={handleChange('iban')}
            placeholder="CH93 0076 2011 6238 5295 7"
            error={errors.fromIban}
            required
          />
        </div>
      </div>
    </div>
  )
}

