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

  // Calculate item positions
  const itemRowHeight = 34
  const items = invoice.items.length > 0 ? invoice.items : []

  return (
    <div className="bg-white relative w-[595px] h-[842px]">
      {/* Beige background for table values area */}
      <div className="absolute h-[194px] left-[297px] top-[294px] w-[282px] bg-[#f7f5f3]" />

      {/* Date info beige box */}
      <div className="absolute h-[52px] left-[16px] top-[242px] w-[281px] bg-[#f7f5f3] rounded-l-[12px]" />

      {/* Due date */}
      <div className="absolute flex flex-col gap-[4px] items-start leading-[14px] right-[499px] text-[10px] top-[252px]">
        <p className="font-['Radio_Canada_Big'] font-medium text-[#5e6470]">Due date</p>
        <p className="font-['Radio_Canada_Big'] font-semibold text-[#1a1c21]">
          {formatDateFigma(invoice.due_date) || '15 Aug, 2023'}
        </p>
      </div>

      {/* Issued */}
      <div className="absolute flex flex-col gap-[4px] items-end leading-[14px] right-[314px] text-[10px] text-right top-[252px]">
        <p className="font-['Radio_Canada_Big'] font-medium text-[#5e6470]">Issued</p>
        <p className="font-['Radio_Canada_Big'] font-semibold text-[#1a1c21]">
          {formatDateFigma(invoice.issued_on) || '1 Aug, 2023'}
        </p>
      </div>

      {/* Invoice number */}
      <div className="absolute flex flex-col gap-[4px] items-start leading-[14px] left-[313px] text-[10px] top-[252px]">
        <p className="font-['Radio_Canada_Big'] font-medium text-[#5e6470]">Invoice number</p>
        <p className="font-['Radio_Canada_Big'] font-semibold text-[#1a1c21]">
          #{invoice.invoice_number || 'AB2324-01'}
        </p>
      </div>

      {/* Billed to */}
      <div className="absolute flex flex-col gap-[4px] items-start left-[313px] top-[103px]">
        <p className="font-['Radio_Canada_Big'] font-medium leading-[14px] text-[#5e6470] text-[10px]">Billed to</p>
        <div className="flex flex-col gap-[2px] items-start leading-[14px] text-[10px]">
          <p className="font-['Radio_Canada_Big'] font-semibold text-[#1a1c21]">
            {invoice.to_info.name || 'To Company Name'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">
            {invoice.to_info.address || 'Address'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">
            {invoice.to_info.zip || 'Zip/City'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">Telephone</p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">Email</p>
        </div>
      </div>

      {/* Billed from */}
      <div className="absolute flex flex-col gap-[4px] items-start left-[32px] top-[103px]">
        <p className="font-['Radio_Canada_Big'] font-medium leading-[14px] text-[#5e6470] text-[10px]">Billed from</p>
        <div className="flex flex-col gap-[2px] items-start leading-[14px] text-[10px]">
          <p className="font-['Radio_Canada_Big'] font-semibold text-[#1a1c21]">
            {invoice.from_info.name || 'From Company Name'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">
            {invoice.from_info.street || 'Address'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">
            {invoice.from_info.zip || 'Zip/City'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">Telephone</p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">Email</p>
        </div>
      </div>

      {/* Payment information */}
      <div className="absolute flex flex-col gap-[4px] items-start left-[32px] top-[603px]">
        <p className="font-['Radio_Canada_Big'] font-medium leading-[14px] text-[#5e6470] text-[10px]">Payment information</p>
        <div className="flex flex-col gap-[2px] items-start leading-[14px] text-[10px]">
          <p className="font-['Radio_Canada_Big'] font-semibold text-[#1a1c21]">
            {invoice.from_info.iban || 'IBAN'}
          </p>
          <p className="font-['Radio_Canada_Big'] font-normal text-[#5e6470]">
            Payment method: {invoice.payment_method}
          </p>
        </div>
      </div>

      {/* Table headers */}
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[32px] text-[#5e6470] text-[10px] top-[304px]">
        Item description
      </p>
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#5e6470] text-[10px] top-[304px] w-[20px] whitespace-pre-wrap">
        Qty
      </p>
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[448px] text-[#5e6470] text-[10px] text-right top-[304px] translate-x-[-100%] w-[36px] whitespace-pre-wrap">
        Rate
      </p>
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[563px] text-[#5e6470] text-[10px] text-right top-[304px] translate-x-[-100%] w-[51px] whitespace-pre-wrap">
        Amount
      </p>

      {/* Divider line after header */}
      <div className="absolute h-0 left-1/2 top-[328px] translate-x-[-50%] w-[531px] border-t border-[#e0e0e0]" />

      {/* Item rows */}
      {items.length > 0 ? (
        items.map((item, index) => {
          const itemTotal = calculateItemTotal(item)
          const rate = parseFloat(String(item.pricePerUm)) || 0
          const qty = parseFloat(String(item.quantity)) || 0
          const rowTop = 338 + (index * itemRowHeight)
          const dividerTop = 362 + (index * itemRowHeight)
          
          return (
            <React.Fragment key={item.id || index}>
              {/* Item description */}
              <p 
                className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[32px] text-[#1a1c21] text-[10px]"
                style={{ top: `${rowTop}px` }}
              >
                {item.description || 'Item Name'}
              </p>
              {/* Qty */}
              <p 
                className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#1a1c21] text-[10px]"
                style={{ top: `${rowTop}px` }}
              >
                {qty}
              </p>
              {/* Rate */}
              <p 
                className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[448px] text-[#1a1c21] text-[10px] text-right translate-x-[-100%]"
                style={{ top: `${rowTop}px` }}
              >
                {formatCurrencyDisplay(rate, invoice.currency)}
              </p>
              {/* Amount */}
              <p 
                className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] right-[32px] text-[#1a1c21] text-[10px] text-right"
                style={{ top: `${rowTop}px` }}
              >
                {formatCurrencyDisplay(itemTotal, invoice.currency)}
              </p>
              {/* Divider */}
              <div 
                className="absolute h-0 left-1/2 translate-x-[-50%] w-[531px] border-t border-[#e0e0e0]"
                style={{ top: `${dividerTop}px` }}
              />
            </React.Fragment>
          )
        })
      ) : (
        <>
          {/* Default item 1 */}
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[32px] text-[#1a1c21] text-[10px] top-[338px]">Item Name</p>
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#1a1c21] text-[10px] top-[338px]">1</p>
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[448px] text-[#1a1c21] text-[10px] text-right top-[338px] translate-x-[-100%]">$3,000.00</p>
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] right-[32px] text-[#1a1c21] text-[10px] text-right top-[338px]">$3,000.00</p>
          <div className="absolute h-0 left-1/2 top-[362px] translate-x-[-50%] w-[531px] border-t border-[#e0e0e0]" />

          {/* Default item 2 */}
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[32px] text-[#1a1c21] text-[10px] top-[372px]">Item Name</p>
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#1a1c21] text-[10px] top-[372px]">1</p>
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[448px] text-[#1a1c21] text-[10px] text-right top-[372px] translate-x-[-100%]">$1,500.00</p>
          <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] right-[32px] text-[#1a1c21] text-[10px] text-right top-[372px]">$1,500.00</p>
          <div className="absolute h-0 left-1/2 top-[396px] translate-x-[-50%] w-[531px] border-t border-[#e0e0e0]" />
        </>
      )}

      {/* Subtotal */}
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#1a1c21] text-[10px] top-[406px]">
        Subtotal
      </p>
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[563px] text-[#1a1c21] text-[10px] text-right top-[406px] translate-x-[-100%]">
        {formatCurrencyDisplay(invoice.subtotal, invoice.currency)}
      </p>

      {/* Tax */}
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#1a1c21] text-[10px] top-[430px]">
        Tax ({taxRate}%)
      </p>
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[563px] text-[#1a1c21] text-[10px] text-right top-[430px] translate-x-[-100%]">
        {formatCurrencyDisplay(invoice.vat_amount, invoice.currency)}
      </p>

      {/* Divider before total */}
      <div className="absolute h-0 left-[calc(50%+140.5px)] top-[454px] translate-x-[-50%] w-[250px] border-t border-[#e0e0e0]" />

      {/* Total */}
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[#1a1c21] text-[10px] top-[464px]">
        Total
      </p>
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[563px] text-[#1a1c21] text-[10px] text-right top-[464px] translate-x-[-100%]">
        {formatCurrencyDisplay(invoice.total, invoice.currency)}
      </p>

      {/* Total Due bar */}
      <div className="absolute h-[40px] left-[297px] top-[488px] w-[282px] bg-[#151514] rounded-b-[12px]" />
      
      {/* Total Due label */}
      <p className="absolute font-['Radio_Canada_Big'] font-medium leading-[14px] left-[313px] text-[10px] text-white top-[501px]">
        Total Due
      </p>
      
      {/* Total Due amount */}
      <div className="absolute flex font-['Radio_Canada_Big'] font-extrabold gap-[2px] items-start leading-[20px] right-[32px] text-[12px] text-white text-right top-[498px] tracking-[0.24px]">
        <p>{invoice.currency === 'USD' || invoice.currency === 'US$' ? 'US$' : invoice.currency}</p>
        <p>{invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>

      {/* Created with Fakturio.ch */}
      <p className="absolute font-['Radio_Canada_Big'] font-normal leading-[14px] left-[148.37px] text-[#5e6470] text-[10px] text-right top-[521px] translate-x-[-100%]">
        Created with Fakturio.ch
      </p>

      {/* QR Code - bottom right */}
      <div className="absolute right-[32px] top-[580px] flex flex-col items-center">
        {isLoadingQR ? (
          <div className="w-[100px] h-[100px] bg-[#f0f0f0] rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-[10px] text-[#999]">Loading QR...</span>
          </div>
        ) : qrCodeDataUrl && !qrError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
  )
}
