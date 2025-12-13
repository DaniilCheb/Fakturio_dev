'use client'

import React from 'react'
import { InvoiceItem } from '@/lib/types/invoice'
import { PlusIcon } from '../Icons'
import Input from '../Input'
import Select from '../Select'
import { calculateItemTotal, calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { formatSwissCurrency, formatNumber } from '@/lib/utils/formatters'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

const SWISS_VAT_RATES = [
  { value: '8.1', label: '8.1%' },
  { value: '2.6', label: '2.6%' },
  { value: '3.8', label: '3.8%' },
  { value: '0', label: '0%' }
]

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

interface ProductsSectionProps {
  items: InvoiceItem[]
  discount: number | string
  currency: string
  onChangeItems: (items: InvoiceItem[]) => void
  onChangeDiscount: (discount: number | string) => void
  errors?: {
    items?: string
  }
  onClearError?: (field: string) => void
}

export default function ProductsSection({
  items,
  discount,
  currency,
  onChangeItems,
  onChangeDiscount,
  errors = {},
  onClearError
}: ProductsSectionProps) {
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quantity: '',
      um: 'pcs', // Default unit of measure
      description: '',
      pricePerUm: '',
      vat: '0'
    }
    onChangeItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    // Clear global items error when user makes any change to an item
    if (errors.items && onClearError) {
      onClearError('items')
    }
    onChangeItems(
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      onChangeItems(items.filter(item => item.id !== id))
    }
  }

  const isItemValid = (item: InvoiceItem): boolean => {
    const qty = parseFloat(String(item.quantity)) || 0
    const price = parseFloat(String(item.pricePerUm)) || 0
    const description = String(item.description || '').trim()
    return qty > 0 && price > 0 && description.length > 0
  }

  // Clear error when at least one item becomes valid
  React.useEffect(() => {
    if (errors.items && items.some(item => isItemValid(item)) && onClearError) {
      onClearError('items')
    }
  }, [items, errors.items, onClearError])

  const hasInvalidItems = errors.items && items.every(item => !isItemValid(item))

  const totals = calculateGrandTotal(items, discount)

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2 w-full">
        <h2 className="text-[15px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
          Products
        </h2>
        <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col gap-5">
            {/* Product Items */}
            <div className="flex flex-col gap-[26px]">
              {items.map((item, index) => {
                const isFirstInvalidItem = hasInvalidItems && !isItemValid(item) && index === items.findIndex(i => !isItemValid(i))
                const lineTotal = calculateItemTotal(item)
                
                return (
                  <div key={item.id} className="flex flex-col gap-2 sm:gap-[10px] group relative">
                    {/* Mobile: Two rows, Desktop: Single row with all fields */}
                    <div className="grid grid-cols-[1fr_1.25fr_1fr_1fr] md:grid-cols-[0.7fr_1fr_2fr_0.8fr_1fr] gap-[12px] sm:gap-[14px] items-start">
                      {/* Qty */}
                      <div className="pl-0">
                        <Input
                          label="Qty"
                          type="number"
                          min="0"
                          step="1"
                          value={String(item.quantity)}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          placeholder="0"
                          error={isFirstInvalidItem ? 'Required' : undefined}
                          className="h-[40px] text-left"
                        />
                      </div>
                      
                      {/* Price/UM */}
                      <div>
                        <Input
                          label="Price/UM"
                          type="number"
                          min="0"
                          step="0.01"
                          value={String(item.pricePerUm)}
                          onChange={(e) => updateItem(item.id, 'pricePerUm', e.target.value)}
                          placeholder="0.00"
                          error={hasInvalidItems && !isItemValid(item) && !isFirstInvalidItem ? 'Required' : undefined}
                          className="h-[40px] text-left"
                        />
                      </div>
                      
                      {/* Description - Hidden on mobile, shown inline on desktop */}
                      <div className="hidden md:block md:order-none order-last">
                        <Input
                          label="Description"
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Enter description"
                          error={hasInvalidItems && !isItemValid(item) && !isFirstInvalidItem ? 'Required' : undefined}
                          className="h-[40px]"
                        />
                      </div>
                      
                      {/* VAT */}
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Select
                                label="VAT"
                                value={String(item.vat ?? '0')}
                                onChange={(e) => updateItem(item.id, 'vat', e.target.value)}
                                options={SWISS_VAT_RATES}
                                className="h-[40px]"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top"
                            className="bg-[#141414] dark:bg-[#1a1a1a] text-white border-none rounded-lg px-3 py-2 text-[12px] max-w-[300px]"
                          >
                            <TooltipPrimitive.Arrow className="fill-[#141414] dark:fill-[#1a1a1a]" />
                            <div className="space-y-1">
                              <p><strong>8.1%</strong> - Standard rate</p>
                              <p><strong>2.6%</strong> - Food, books, meds</p>
                              <p><strong>3.8%</strong> - Accommodation</p>
                              <p><strong>0%</strong> - Exempt</p>
                              <p className="mt-2 pt-2 border-t border-white/20 text-[11px]">
                                VAT required if turnover &gt;100k CHF
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      
                      {/* Total */}
                      <div className="flex flex-col gap-1 relative">
                        <label className="text-[13px] font-medium text-[rgba(20,20,20,0.8)] dark:text-[#999] tracking-[-0.208px] text-right">
                          Total
                        </label>
                        <div className="flex items-center justify-end gap-2 h-[40px]">
                          <div className="text-right font-normal text-[#141414] dark:text-white text-[14px]">
                            {formatNumber(lineTotal)}
                          </div>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-[#9e9e9e] dark:text-[#666] hover:text-[#141414] dark:hover:text-white transition-all absolute right-0"
                            >
                              <XIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description - Shown only on mobile (full width below) */}
                    <div className="md:hidden">
                      <Input
                        label="Description"
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Enter description"
                        error={hasInvalidItems && !isItemValid(item) && !isFirstInvalidItem ? 'Required' : undefined}
                        className="h-[40px]"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 pt-4 border-t border-[#f0f0f0] dark:border-[#333]">
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors"
              >
                <PlusIcon size={12} />
                Add item
              </button>
              
              {/* Discount */}
              <div className="flex items-center gap-2 justify-end sm:justify-start">
                <span className="text-[13px] text-[#474743] dark:text-[#999]">Discount</span>
                <div className="relative w-[70px]">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={String(discount)}
                    onChange={(e) => onChangeDiscount(e.target.value)}
                    noLabel
                    className="h-[36px] pl-2 pr-6 text-[13px] text-right"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-[#9e9e9e] dark:text-[#666] pointer-events-none">%</span>
                </div>
              </div>
            </div>

            {/* Summary Section */}
            <div className="pt-4 border-t border-[#e0e0e0] dark:border-[#444]">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between sm:justify-end items-center gap-4 sm:gap-8">
                  <span className="text-[13px] text-[#474743] dark:text-[#999]">Subtotal</span>
                  <span className="text-[14px] text-[#141414] dark:text-white min-w-[100px] sm:min-w-[140px] text-right whitespace-nowrap">
                    {formatSwissCurrency(totals.subtotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between sm:justify-end items-center gap-4 sm:gap-8 pt-2 border-t border-[#e0e0e0] dark:border-[#444]">
                  <span className="text-[14px] font-medium text-[#141414] dark:text-white whitespace-nowrap">
                    Total (incl. VAT)
                  </span>
                  <span className="text-[18px] sm:text-[20px] font-semibold text-[#141414] dark:text-white min-w-[100px] sm:min-w-[140px] text-right whitespace-nowrap">
                    {formatSwissCurrency(totals.total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
