'use client'

import React from 'react'
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Label } from '@/app/components/ui/label'
import { Input } from '@/app/components/ui/input'
import { cn } from '@/lib/utils'
import { ValidationErrors } from '@/lib/utils/invoiceValidation'
import { Switch } from '@/app/components/ui/switch'

const CURRENCIES = ['CHF', 'EUR', 'USD', 'GBP']
const PAYMENT_METHODS = ['Bank', 'Card', 'Cash', 'Other'] as const

interface GuestPaymentInformationSectionProps {
  currency: string
  paymentMethod: 'Bank' | 'Card' | 'Cash' | 'Other'
  iban: string
  onCurrencyChange: (value: string) => void
  onPaymentMethodChange: (value: string) => void
  onIbanChange: (value: string) => void
  errors?: ValidationErrors
  onClearError?: (field: keyof ValidationErrors) => void
  enableQR?: boolean
  onEnableQRChange?: (enabled: boolean) => void
}

export default function GuestPaymentInformationSection({
  currency,
  paymentMethod,
  iban,
  onCurrencyChange,
  onPaymentMethodChange,
  onIbanChange,
  errors = {},
  onClearError,
  enableQR = true,
  onEnableQRChange
}: GuestPaymentInformationSectionProps) {
  
  const handleCurrencyChange = (value: string) => {
    onCurrencyChange(value)
    onClearError?.('currency')
  }

  const handlePaymentMethodChange = (value: string) => {
    onPaymentMethodChange(value)
    onClearError?.('payment_method')
  }

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onIbanChange(e.target.value)
    onClearError?.('fromIban')
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        Payment Information
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          {/* Currency and Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Currency */}
            <div className="flex flex-col gap-1" data-field="currency">
              <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Currency <span className="text-destructive">*</span>
              </Label>
              <ShadcnSelect
                value={currency}
                onValueChange={handleCurrencyChange}
              >
                <SelectTrigger className={cn(
                  "w-full",
                  errors.currency && "border-destructive focus:ring-destructive"
                )}>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadcnSelect>
              {errors.currency && (
                <p className="text-destructive text-[12px] mt-1">
                  {errors.currency}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1" data-field="payment_method">
              <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
                Payment method <span className="text-destructive">*</span>
              </Label>
              <div className={cn(
                "flex items-center bg-[#F7F5F2] dark:bg-[#2a2a2a] border rounded-lg p-1 h-[40px]",
                errors.payment_method 
                  ? "border-destructive" 
                  : "border-[#e0e0e0] dark:border-[#444]"
              )}>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={cn(
                      "flex-1 h-full rounded-md text-[14px] font-medium transition-all",
                      paymentMethod === method
                        ? "bg-white dark:bg-[#333] text-[#141414] dark:text-white shadow-sm border border-[#e0e0e0] dark:border-[#444]"
                        : "text-[#666666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white"
                    )}
                    onClick={() => handlePaymentMethodChange(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {errors.payment_method && (
                <p className="text-destructive text-[12px] mt-1">
                  {errors.payment_method}
                </p>
              )}
            </div>
          </div>

          {/* IBAN */}
          <div className="flex flex-col gap-1" data-field="fromIban">
            <Label className="font-medium text-[13px] text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px]">
              IBAN <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              value={iban}
              onChange={handleIbanChange}
              placeholder="CH00 0000 0000 0000 0000 0"
              className={cn(
                "font-mono text-[14px]",
                errors.fromIban && "border-destructive focus:ring-destructive"
              )}
            />
            {errors.fromIban && (
              <p className="text-destructive text-[12px] mt-1">
                {errors.fromIban}
              </p>
            )}
          </div>

          {/* QR Code Toggle */}
          {onEnableQRChange && (
            <div className="pt-3 border-t border-[#e0e0e0] dark:border-[#333]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-medium text-design-content-default">
                    Enable QR
                  </span>
                  <span className="text-[13px] text-design-content-weak">
                    Get paid 3x faster
                  </span>
                </div>
                <Switch checked={enableQR} onCheckedChange={onEnableQRChange} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

