'use client'

import React from 'react'
import { GuestInvoice } from '@/lib/types/invoice'
import { formatSwissCurrency } from '@/lib/utils/formatters'
import { calculateItemTotal } from '@/lib/utils/invoiceCalculations'
import { format, parseISO } from 'date-fns'

interface InvoicePreviewV2Props {
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

// Format currency with $ symbol for display
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

export default function InvoicePreviewV2({ 
  invoice, 
  qrCodeDataUrl, 
  qrCodeType = 'none',
  isLoadingQR = false 
}: InvoicePreviewV2Props) {
  // Calculate tax amount (using first item's VAT rate or default 10%)
  const taxRate = invoice.items.length > 0 
    ? (parseFloat(String(invoice.items[0].vat)) || 10) 
    : 10

  return (
    <div className="bg-white w-[595px] min-h-[842px] relative font-['Inter',sans-serif] text-[#1a1c21]">
      {/* Header Section */}
      <div className="px-8 pt-7 pb-6">
        <div className="flex justify-between items-start">
          {/* Left side - Logo placeholder */}
          <div>
            <div className="w-[160px] h-[48px] bg-[rgba(21,21,20,0.4)] flex items-center justify-center">
              <span className="text-[12px] font-bold text-[#151514] leading-4">
                Customer logo
              </span>
            </div>
          </div>
          
          {/* Right side - Company info */}
          <div className="text-right text-[10px] leading-[14px] text-[#5e6470] font-normal space-y-0.5">
            <p>{invoice.from_info.name || 'Company name'}</p>
            <p>Your name</p>
            <p>{invoice.from_info.street || 'Street'}</p>
            <p>{invoice.from_info.zip || 'ZIP/City'}</p>
            {invoice.from_info.iban && <p>{invoice.from_info.iban}</p>}
            <p>Telephone</p>
            <p>email</p>
            <p>website</p>
          </div>
        </div>
        
        {/* From Company Name */}
        <p className="mt-2 text-[12px] font-bold text-[#151514] font-['Radio_Canada_Big',sans-serif]">
          {invoice.from_info.name || 'From-company name'}
        </p>
      </div>

      {/* Billed To Section */}
      <div className="px-8 mb-4">
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">
            Billed to
          </p>
          <div className="flex flex-col gap-0.5 text-[10px] leading-[14px]">
            <p className="font-semibold text-[#1a1c21]">
              {invoice.to_info.name || 'To Company Name'}
            </p>
            <p className="font-normal text-[#5e6470]">
              {invoice.to_info.address || 'Address'}
            </p>
            <p className="font-normal text-[#5e6470]">
              {invoice.to_info.zip || 'Zip/City'}
            </p>
            <p className="font-normal text-[#5e6470]">Telephone</p>
            <p className="font-normal text-[#5e6470]">Email</p>
          </div>
        </div>
      </div>

      {/* Date Info Box */}
      <div className="px-4">
        <div className="flex">
          {/* Left box with dates */}
          <div className="bg-[#f7f5f3] rounded-tl-[12px] rounded-bl-[12px] px-4 py-2.5 w-[281px]">
            <div className="flex justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Due date</p>
                <p className="text-[10px] font-semibold text-[#1a1c21] leading-[14px]">
                  {formatDateFigma(invoice.due_date) || '15 Aug, 2023'}
                </p>
              </div>
              <div className="flex flex-col gap-1 text-right">
                <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Issued</p>
                <p className="text-[10px] font-semibold text-[#1a1c21] leading-[14px]">
                  {formatDateFigma(invoice.issued_on) || '1 Aug, 2023'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right box with invoice number */}
          <div className="px-4 py-2.5 flex-1">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-medium text-[#5e6470] leading-[14px]">Invoice number</p>
              <p className="text-[10px] font-semibold text-[#1a1c21] leading-[14px]">
                #{invoice.invoice_number || 'AB2324-01'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="px-4 mt-4">
        {/* Table Header */}
        <div className="px-4 py-3 flex">
          <div className="flex-1 text-[10px] font-medium text-[#5e6470] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
            Item description
          </div>
          <div className="w-[50px] text-[10px] font-medium text-[#5e6470] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
            Qty
          </div>
          <div className="w-[85px] text-right text-[10px] font-medium text-[#5e6470] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
            Rate
          </div>
          <div className="w-[85px] text-right text-[10px] font-medium text-[#5e6470] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
            Amount
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-[1px] bg-[#e0e0e0]" />

        {/* Items Table with background */}
        <div className="flex">
          {/* Left column - Item descriptions */}
          <div className="flex-1">
            {invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <div key={item.id} className="px-4 py-3 flex border-b border-[#e0e0e0] last:border-b-0">
                  <div className="flex-1 text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                    {item.description || 'Item Name'}
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="px-4 py-3 flex border-b border-[#e0e0e0]">
                  <div className="flex-1 text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                    Item Name
                  </div>
                </div>
                <div className="px-4 py-3 flex">
                  <div className="flex-1 text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                    Item Name
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right column - with beige background */}
          <div className="bg-[#f7f5f3] w-[282px] rounded-tr-0 rounded-br-0">
            {invoice.items.length > 0 ? (
              invoice.items.map((item, index) => {
                const itemTotal = calculateItemTotal(item)
                const rate = parseFloat(String(item.pricePerUm)) || 0
                const qty = parseFloat(String(item.quantity)) || 0
                
                return (
                  <div key={item.id} className="px-4 py-3 flex border-b border-[#e0e0e0] last:border-b-0">
                    <div className="w-[50px] text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                      {qty}
                    </div>
                    <div className="w-[85px] text-right text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                      {formatCurrencyDisplay(rate, invoice.currency)}
                    </div>
                    <div className="w-[85px] text-right text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                      {formatCurrencyDisplay(itemTotal, invoice.currency)}
                    </div>
                  </div>
                )
              })
            ) : (
              <>
                <div className="px-4 py-3 flex border-b border-[#e0e0e0]">
                  <div className="w-[50px] text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">1</div>
                  <div className="w-[85px] text-right text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">$3,000.00</div>
                  <div className="w-[85px] text-right text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">$3,000.00</div>
                </div>
                <div className="px-4 py-3 flex">
                  <div className="w-[50px] text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">1</div>
                  <div className="w-[85px] text-right text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">$1,500.00</div>
                  <div className="w-[85px] text-right text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">$1,500.00</div>
                </div>
              </>
            )}

            {/* Divider before totals */}
            <div className="mx-4 h-[1px] bg-[#e0e0e0]" />

            {/* Subtotal */}
            <div className="px-4 py-2 flex justify-between">
              <div className="text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                Subtotal
              </div>
              <div className="text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px] text-right">
                {formatCurrencyDisplay(invoice.subtotal, invoice.currency)}
              </div>
            </div>

            {/* Tax */}
            <div className="px-4 py-2 flex justify-between">
              <div className="text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                Tax ({taxRate}%)
              </div>
              <div className="text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px] text-right">
                {formatCurrencyDisplay(invoice.vat_amount, invoice.currency)}
              </div>
            </div>

            {/* Divider before total */}
            <div className="mx-4 h-[1px] bg-[#e0e0e0]" />

            {/* Total */}
            <div className="px-4 py-2 flex justify-between">
              <div className="text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                Total
              </div>
              <div className="text-[10px] font-medium text-[#1a1c21] font-['Radio_Canada_Big',sans-serif] leading-[14px] text-right">
                {formatCurrencyDisplay(invoice.total, invoice.currency)}
              </div>
            </div>

            {/* Total Due - Black bar */}
            <div className="bg-[#151514] rounded-bl-[12px] rounded-br-[12px] px-4 py-2.5 flex justify-between items-center">
              <div className="text-[10px] font-medium text-white font-['Radio_Canada_Big',sans-serif] leading-[14px]">
                Total Due
              </div>
              <div className="text-[12px] font-extrabold text-white leading-5 tracking-[0.24px] flex gap-0.5">
                <span>{invoice.currency === 'USD' || invoice.currency === 'US$' ? 'US$' : invoice.currency}</span>
                <span>{invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-5 left-8">
        <p className="text-[10px] font-normal text-[#5e6470] leading-[14px]">
          Created with Fakturio.ch
        </p>
      </div>

      {/* QR Code Section (if enabled) */}
      {(isLoadingQR || qrCodeDataUrl) && (
        <div className="absolute bottom-5 right-8 flex flex-col items-center">
          {isLoadingQR ? (
            <div className="w-[80px] h-[80px] bg-[#f0f0f0] rounded-lg animate-pulse flex items-center justify-center">
              <span className="text-[10px] text-[#999]">Loading...</span>
            </div>
          ) : qrCodeDataUrl ? (
            <>
              <img 
                src={qrCodeDataUrl} 
                alt="Payment QR Code" 
                className="w-[80px] h-[80px] rounded"
              />
              <p className="text-[8px] text-[#5e6470] mt-1 text-center">
                {qrCodeType === 'swiss' ? 'Swiss QR Payment' : 'Scan to pay'}
              </p>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

