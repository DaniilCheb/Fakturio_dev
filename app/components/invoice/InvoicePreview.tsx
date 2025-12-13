'use client'

import React, { useState } from 'react'
import { GuestInvoice } from '@/lib/types/invoice'
import { calculateItemTotal } from '@/lib/utils/invoiceCalculations'
import { format, parseISO } from 'date-fns'

interface InvoicePreviewProps {
  invoice: GuestInvoice
  qrCodeDataUrl?: string | null
  qrCodeType?: 'swiss' | 'simple' | 'none'
  isLoadingQR?: boolean
}

// Format date to Figma style: "15 Aug, 2023"
function formatDateFigma(date: string | Date | null | undefined): string {
  if (!date) return ''
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'd MMM, yyyy')
  } catch {
    return ''
  }
}

// Format currency with proper symbol
function formatCurrencyDisplay(value: number | string | undefined | null, currency: string = 'USD'): string {
  if (value === undefined || value === null || value === '') return '$0.00'
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '$0.00'
  
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  if (currency === 'USD' || currency === 'US$') {
    return `$${formatted}`
  } else if (currency === 'CHF') {
    return `CHF ${formatted}`
  } else if (currency === 'EUR') {
    return `€${formatted}`
  }
  return `${currency} ${formatted}`
}

export default function InvoicePreview({ 
  invoice, 
  qrCodeDataUrl, 
  qrCodeType = 'none',
  isLoadingQR = false 
}: InvoicePreviewProps) {
  const [qrError, setQrError] = useState(false)
  
  // Calculate tax rate from first item or use default
  const taxRate = invoice.items.length > 0 
    ? (parseFloat(String(invoice.items[0].vat)) || 10) 
    : 10

  return (
    <div className="bg-white w-full max-w-[656px] mx-auto p-8 font-['Inter',sans-serif] text-[#1a1c21]">
      {/* Billed from / Billed to - Two columns */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Billed from */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Billed from</p>
          <div className="flex flex-col gap-0.5 text-[10px] leading-[14px]">
            <p className="font-semibold text-[#1a1c21]">{invoice.from_info.name || 'Company Name'}</p>
            <p className="font-normal text-[#5e6470]">{invoice.from_info.street || 'Address'}</p>
            <p className="font-normal text-[#5e6470]">{invoice.from_info.zip || 'Zip/City'}</p>
            <p className="font-normal text-[#5e6470]">Telephone</p>
            <p className="font-normal text-[#5e6470]">Email</p>
          </div>
        </div>
        
        {/* Billed to */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Billed to</p>
          <div className="flex flex-col gap-0.5 text-[10px] leading-[14px]">
            <p className="font-semibold text-[#1a1c21]">{invoice.to_info.name || 'Company Name'}</p>
            <p className="font-normal text-[#5e6470]">{invoice.to_info.address || 'Address'}</p>
            <p className="font-normal text-[#5e6470]">{invoice.to_info.zip || 'Zip/City'}</p>
            <p className="font-normal text-[#5e6470]">Telephone</p>
            <p className="font-normal text-[#5e6470]">Email</p>
          </div>
        </div>
      </div>

      {/* Date info row */}
      <div className="flex mb-6">
        {/* Beige box with Due date and Issued */}
        <div className="bg-[#f7f5f3] rounded-l-xl px-5 py-3 flex-1 max-w-[300px]">
          <div className="flex justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Due date</p>
              <p className="text-[10px] font-semibold text-[#1a1c21] leading-[14px]">
                {formatDateFigma(invoice.due_date) || '15 Aug, 2023'}
              </p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Issued</p>
              <p className="text-[10px] font-semibold text-[#1a1c21] leading-[14px]">
                {formatDateFigma(invoice.issued_on) || '1 Aug, 2023'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Invoice number */}
        <div className="px-5 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Invoice number</p>
            <p className="text-[10px] font-semibold text-[#1a1c21] leading-[14px]">
              #{invoice.invoice_number || 'AB2324-01'}
            </p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        {/* Header */}
        <div className="flex border-b border-[#e0e0e0] py-3">
          <div className="flex-1 text-[10px] font-medium text-[#5e6470] leading-[14px]">
            Item description
          </div>
          <div className="w-[60px] text-[10px] font-medium text-[#5e6470] leading-[14px] bg-[#f7f5f3] px-2">
            Qty
          </div>
          <div className="w-[100px] text-right text-[10px] font-medium text-[#5e6470] leading-[14px] bg-[#f7f5f3] px-2">
            Rate
          </div>
          <div className="w-[100px] text-right text-[10px] font-medium text-[#5e6470] leading-[14px] bg-[#f7f5f3] px-2">
            Amount
          </div>
        </div>

        {/* Item rows */}
        {invoice.items.length > 0 ? (
          invoice.items.map((item, index) => {
            const itemTotal = calculateItemTotal(item)
            const rate = parseFloat(String(item.pricePerUm)) || 0
            const qty = parseFloat(String(item.quantity)) || 0
            
            return (
              <div key={item.id || index} className="flex border-b border-[#e0e0e0] py-3">
                <div className="flex-1 text-[10px] font-medium text-[#1a1c21] leading-[14px]">
                  {item.description || 'Item Name'}
                </div>
                <div className="w-[60px] text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">
                  {qty}
                </div>
                <div className="w-[100px] text-right text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">
                  {formatCurrencyDisplay(rate, invoice.currency)}
                </div>
                <div className="w-[100px] text-right text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">
                  {formatCurrencyDisplay(itemTotal, invoice.currency)}
                </div>
              </div>
            )
          })
        ) : (
          <>
            <div className="flex border-b border-[#e0e0e0] py-3">
              <div className="flex-1 text-[10px] font-medium text-[#1a1c21] leading-[14px]">Item Name</div>
              <div className="w-[60px] text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">1</div>
              <div className="w-[100px] text-right text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">$3,000.00</div>
              <div className="w-[100px] text-right text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">$3,000.00</div>
            </div>
            <div className="flex border-b border-[#e0e0e0] py-3">
              <div className="flex-1 text-[10px] font-medium text-[#1a1c21] leading-[14px]">Item Name</div>
              <div className="w-[60px] text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">1</div>
              <div className="w-[100px] text-right text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">$1,500.00</div>
              <div className="w-[100px] text-right text-[10px] font-medium text-[#1a1c21] leading-[14px] bg-[#f7f5f3] px-2">$1,500.00</div>
            </div>
          </>
        )}

        {/* Totals section - in beige area */}
        <div className="flex">
          <div className="flex-1" />
          <div className="w-[260px] bg-[#f7f5f3]">
            {/* Subtotal */}
            <div className="flex justify-between py-2 px-2">
              <span className="text-[10px] font-medium text-[#1a1c21] leading-[14px]">Subtotal</span>
              <span className="text-[10px] font-medium text-[#1a1c21] leading-[14px]">
                {formatCurrencyDisplay(invoice.subtotal, invoice.currency)}
              </span>
            </div>
            
            {/* Tax */}
            <div className="flex justify-between py-2 px-2">
              <span className="text-[10px] font-medium text-[#1a1c21] leading-[14px]">Tax ({taxRate}%)</span>
              <span className="text-[10px] font-medium text-[#1a1c21] leading-[14px]">
                {formatCurrencyDisplay(invoice.vat_amount, invoice.currency)}
              </span>
            </div>
            
            {/* Divider */}
            <div className="mx-2 h-[1px] bg-[#e0e0e0]" />
            
            {/* Total */}
            <div className="flex justify-between py-2 px-2">
              <span className="text-[10px] font-medium text-[#1a1c21] leading-[14px]">Total</span>
              <span className="text-[10px] font-medium text-[#1a1c21] leading-[14px]">
                {formatCurrencyDisplay(invoice.total, invoice.currency)}
              </span>
            </div>
            
            {/* Total Due bar */}
            <div className="bg-[#151514] rounded-b-xl px-4 py-2.5 flex justify-between items-center">
              <span className="text-[10px] font-medium text-white leading-[14px]">Total Due</span>
              <span className="text-[12px] font-extrabold text-white leading-[20px] tracking-[0.24px]">
                {invoice.currency === 'USD' || invoice.currency === 'US$' ? 'US$' : invoice.currency}{' '}
                {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] font-normal text-[#5e6470] leading-[14px] mb-8">
        Created with Fakturio.ch
      </p>

      {/* Bottom section: Payment info + QR Code */}
      <div className="flex justify-between items-start">
        {/* Payment information */}
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Payment information</p>
          <div className="flex flex-col gap-0.5 text-[10px] leading-[14px]">
            <p className="font-semibold text-[#1a1c21]">{invoice.from_info.iban || 'IBAN'}</p>
            <p className="font-normal text-[#5e6470]">Payment method: {invoice.payment_method}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center">
          {isLoadingQR ? (
            <div className="w-[100px] h-[100px] bg-[#f0f0f0] rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-[10px] text-[#999]">Loading QR...</span>
            </div>
          ) : qrCodeDataUrl && !qrError ? (
            <>
              <img 
                src={qrCodeDataUrl} 
                alt="Payment QR Code" 
                className="w-[100px] h-[100px]"
                onError={() => setQrError(true)}
              />
              <p className="text-[8px] text-[#5e6470] mt-1 text-center">
                {qrCodeType === 'swiss' ? 'Swiss QR Payment' : 'Scan to pay'}
              </p>
            </>
          ) : (
            <div className="w-[100px] h-[100px] bg-[#f0f0f0] rounded-lg flex items-center justify-center border border-dashed border-[#ccc]">
              <span className="text-[10px] text-[#999] text-center px-2">QR Code</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
