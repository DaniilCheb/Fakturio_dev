'use client'

import React from 'react'
import CurrencyPicker from '../CurrencyPicker'
import Input from '../Input'
import { Label } from '@/app/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/app/components/ui/toggle-group'
import { cn } from '@/lib/utils'

interface PaymentInformationSectionProps {
  currency: string
  paymentMethod: 'Bank' | 'Card' | 'Cash' | 'Other'
  iban: string
  onCurrencyChange: (currency: string) => void
  onPaymentMethodChange: (method: 'Bank' | 'Card' | 'Cash' | 'Other') => void
  onIbanChange: (iban: string) => void
  errors?: {
    currency?: string
    payment_method?: string
    fromIban?: string
  }
  onClearError?: (field: string) => void
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'Bank', label: 'Bank' },
  { value: 'Card', label: 'Card' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Other', label: 'Other' }
]

export default function PaymentInformationSection({
  currency,
  paymentMethod,
  iban,
  onCurrencyChange,
  onPaymentMethodChange,
  onIbanChange,
  errors = {},
  onClearError
}: PaymentInformationSectionProps) {
  const handleCurrencyChange = (value: string) => {
    onCurrencyChange(value)
    onClearError?.('currency')
  }

  const handlePaymentMethodChange = (value: string) => {
    if (value) {
      onPaymentMethodChange(value as 'Bank' | 'Card' | 'Cash' | 'Other')
      onClearError?.('payment_method')
    }
  }

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIbanChange(e.target.value)
    onClearError?.('fromIban')
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        Payment information
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* First Row: Currency and Payment Method */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <CurrencyPicker
                label="Currency"
                value={currency}
                onChange={handleCurrencyChange}
                error={errors.currency}
                onErrorClear={() => onClearError?.('currency')}
              />
            </div>
            <div className="flex-1">
              <div className="flex flex-col gap-1">
                <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                  Payment method
                </Label>
                <ToggleGroup
                  type="single"
                  value={paymentMethod}
                  onValueChange={handlePaymentMethodChange}
                  className={cn(
                    "inline-flex h-10 items-center justify-center rounded-md border border-input bg-muted p-1 text-muted-foreground",
                    "w-full",
                    errors.payment_method && "border-destructive"
                  )}
                >
                  {PAYMENT_METHOD_OPTIONS.map((option, index) => (
                    <ToggleGroupItem
                      key={option.value}
                      value={option.value}
                      className={cn(
                        "flex-1 h-full px-3 text-sm font-normal transition-all border",
                        "data-[state=on]:!bg-white dark:data-[state=on]:!bg-design-surface-default",
                        "data-[state=on]:!text-design-content-default",
                        "data-[state=on]:!border-design-border-default",
                        "data-[state=on]:shadow-sm",
                        "data-[state=on]:rounded-md",
                        "data-[state=off]:border-transparent data-[state=off]:bg-transparent",
                        "data-[state=off]:text-muted-foreground data-[state=off]:hover:bg-background/50",
                        "data-[state=off]:rounded-none",
                        index === 0 && "data-[state=off]:rounded-l-md",
                        index === PAYMENT_METHOD_OPTIONS.length - 1 && "data-[state=off]:rounded-r-md"
                      )}
                    >
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {errors.payment_method && (
                  <p className="text-destructive text-[12px] mt-1">{errors.payment_method}</p>
                )}
              </div>
            </div>
          </div>

          {/* Second Row: Your IBAN */}
          <div className="w-full">
            <Input
              label="Your IBAN"
              value={iban || ''}
              onChange={handleIbanChange}
              placeholder="Enter your IBAN"
              error={errors.fromIban}
              onErrorClear={() => onClearError?.('fromIban')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

