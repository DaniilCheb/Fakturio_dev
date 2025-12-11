'use client'

import React, { useState } from 'react'
import { InvoiceItem } from '@/lib/types/invoice'
import { PlusIcon } from '../Icons'
import Input from '../Input'
import { calculateItemTotalWithVAT, calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { formatNumber, formatSwissCurrency } from '@/lib/utils/formatters'

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
}

export default function ProductsSection({
  items,
  discount,
  currency,
  onChangeItems,
  onChangeDiscount,
  errors = {}
}: ProductsSectionProps) {
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      quantity: '',
      um: '',
      description: '',
      pricePerUm: '',
      vat: '8.1'
    }
    onChangeItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
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
    const um = parseFloat(String(item.um)) || 0
    const price = parseFloat(String(item.pricePerUm)) || 0
    const description = String(item.description || '').trim()
    return qty > 0 && um > 0 && price > 0 && description.length > 0
  }

  const hasInvalidItems = errors.items && items.every(item => !isItemValid(item))

  const totals = calculateGrandTotal(items, discount)

  return (
    <div className="flex flex-col gap-2 w-full">
      <h2 className="text-[18px] font-medium text-[#141414] dark:text-white tracking-[-0.288px]">
        Products
      </h2>
      <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-5">
        <div className="flex flex-col gap-5">

          {/* Product Items */}
          <div className="flex flex-col gap-[10px]">
            {items.map((item, index) => {
              const isFirstInvalidItem = hasInvalidItems && !isItemValid(item) && index === items.findIndex(i => !isItemValid(i))
              return (
                <div key={item.id} className="flex gap-[10px] items-start group relative">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Enter description"
                      noLabel
                      error={hasInvalidItems && !isItemValid(item) && !isFirstInvalidItem ? 'Required' : undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={String(item.quantity)}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      placeholder="Qty"
                      noLabel
                      error={isFirstInvalidItem ? 'Required field' : undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={String(item.pricePerUm)}
                      onChange={(e) => updateItem(item.id, 'pricePerUm', e.target.value)}
                      placeholder="Price"
                      noLabel
                      error={hasInvalidItems && !isItemValid(item) && !isFirstInvalidItem ? 'Required' : undefined}
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={item.vat || '8.1'}
                      onChange={(e) => updateItem(item.id, 'vat', e.target.value)}
                      className="w-full px-2 py-2 bg-[#f7f5f3] dark:bg-[#2a2a2a] border border-[#e0e0e0] dark:border-[#444] rounded-lg text-[16px] text-[#141414] dark:text-white focus:outline-none focus:border-[#141414] dark:focus:border-white transition-all duration-200"
                    >
                      {SWISS_VAT_RATES.map((rate) => (
                        <option key={rate.value} value={rate.value}>{rate.label}</option>
                      ))}
                    </select>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-[#9e9e9e] dark:text-[#666] hover:text-[#141414] dark:hover:text-white transition-all mt-2"
                    >
                      <XIcon />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="mt-4 pt-4 border-t border-[#e0e0e0] dark:border-[#444]">
            <div className="flex flex-col gap-2">
              <div className="flex justify-end items-center gap-8">
                <span className="text-[13px] text-[#474743] dark:text-[#999]">Subtotal</span>
                <span className="text-[14px] text-[#141414] dark:text-white min-w-[140px] text-right whitespace-nowrap">
                  {formatSwissCurrency(totals.subtotal, currency)}
                </span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-end items-center gap-8">
                  <span className="text-[13px] text-[#474743] dark:text-[#999]">Discount</span>
                  <span className="text-[14px] text-[#141414] dark:text-white min-w-[140px] text-right whitespace-nowrap">
                    - {formatSwissCurrency(totals.discountAmount, currency)}
                  </span>
                </div>
              )}
              {/* Show VAT by rate */}
              {Object.entries(totals.vatBreakdown)
                .filter(([rate, group]) => group.vatAmount > 0)
                .map(([rate, group]) => (
                  <div key={rate} className="flex justify-end items-center gap-8">
                    <span className="text-[13px] text-[#474743] dark:text-[#999]">
                      VAT {rate}%
                    </span>
                    <span className="text-[14px] text-[#141414] dark:text-white min-w-[140px] text-right whitespace-nowrap">
                      {formatSwissCurrency(group.vatAmount * (1 - (parseFloat(String(discount)) || 0) / 100), currency)}
                    </span>
                  </div>
                ))}
              <div className="flex justify-end items-center gap-8 pt-2 border-t border-[#e0e0e0] dark:border-[#444]">
                <span className="text-[14px] font-medium text-[#141414] dark:text-white whitespace-nowrap">
                  Total (incl. VAT)
                </span>
                <span className="text-[24px] font-semibold text-[#141414] dark:text-white min-w-[140px] text-right whitespace-nowrap">
                  {formatSwissCurrency(totals.total, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#f0f0f0] dark:border-[#333] mt-2">
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-[13px] font-medium text-[#141414] dark:text-white hover:text-[#666666] dark:hover:text-[#aaa] transition-colors"
            >
              <PlusIcon size={12} />
              Add item
            </button>
            
            {/* Discount */}
            <div className="flex items-center gap-2">
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
        </div>
      </div>
    </div>
  )
}

