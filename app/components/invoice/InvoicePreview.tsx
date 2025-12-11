'use client'

import React from 'react'
import { GuestInvoice } from '@/lib/types/invoice'
import { formatDate, formatSwissCurrency } from '@/lib/utils/formatters'
import { calculateItemTotal, calculateItemVAT, calculateItemTotalWithVAT } from '@/lib/utils/invoiceCalculations'

interface InvoicePreviewProps {
  invoice: GuestInvoice
}

export default function InvoicePreview({ invoice }: InvoicePreviewProps) {
  return (
    <div className="bg-white dark:bg-[#252525] p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-[#e0e0e0] dark:border-[#333]">
        <div>
          <h1 className="text-[24px] font-semibold text-[#141414] dark:text-white mb-2">INVOICE</h1>
          <p className="text-[14px] text-[#666666] dark:text-[#999]">#{invoice.invoice_number}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] text-[#141414] dark:text-white mb-1">
            Date: {formatDate(invoice.issued_on)}
          </p>
          <p className="text-[14px] text-[#141414] dark:text-white">
            Due: {formatDate(invoice.due_date)}
          </p>
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-[13px] font-medium text-[#474743] dark:text-[#999] mb-3">From</h3>
          <div className="text-[14px] text-[#141414] dark:text-white space-y-1">
            <p>{invoice.from_info.name}</p>
            <p>{invoice.from_info.street}</p>
            <p>{invoice.from_info.zip}</p>
            {invoice.from_info.iban && (
              <p className="mt-2">IBAN: {invoice.from_info.iban}</p>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-medium text-[#474743] dark:text-[#999] mb-3">To</h3>
          <div className="text-[14px] text-[#141414] dark:text-white space-y-1">
            {invoice.to_info.uid && <p>UID: {invoice.to_info.uid}</p>}
            <p>{invoice.to_info.name}</p>
            <p>{invoice.to_info.address}</p>
            <p>{invoice.to_info.zip}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      {invoice.description && (
        <div className="mb-8">
          <p className="text-[14px] text-[#141414] dark:text-white whitespace-pre-wrap">
            {invoice.description}
          </p>
        </div>
      )}

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e0e0e0] dark:border-[#333]">
              <th className="text-left py-3 px-4 text-[13px] font-medium text-[#474743] dark:text-[#999]">Description</th>
              <th className="text-right py-3 px-4 text-[13px] font-medium text-[#474743] dark:text-[#999]">Qty</th>
              <th className="text-right py-3 px-4 text-[13px] font-medium text-[#474743] dark:text-[#999]">Price</th>
              <th className="text-right py-3 px-4 text-[13px] font-medium text-[#474743] dark:text-[#999]">VAT</th>
              <th className="text-right py-3 px-4 text-[13px] font-medium text-[#474743] dark:text-[#999]">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => {
              const total = calculateItemTotalWithVAT(item)
              return (
                <tr key={item.id} className="border-b border-[#f0f0f0] dark:border-[#333]">
                  <td className="py-3 px-4 text-[14px] text-[#141414] dark:text-white">{item.description}</td>
                  <td className="py-3 px-4 text-[14px] text-[#141414] dark:text-white text-right">
                    {item.quantity} × {item.um}
                  </td>
                  <td className="py-3 px-4 text-[14px] text-[#141414] dark:text-white text-right">
                    {formatSwissCurrency(item.pricePerUm, invoice.currency)}
                  </td>
                  <td className="py-3 px-4 text-[14px] text-[#141414] dark:text-white text-right">
                    {item.vat}%
                  </td>
                  <td className="py-3 px-4 text-[14px] font-medium text-[#141414] dark:text-white text-right">
                    {formatSwissCurrency(total, invoice.currency)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-[300px] space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#474743] dark:text-[#999]">Subtotal</span>
            <span className="text-[14px] text-[#141414] dark:text-white">
              {formatSwissCurrency(invoice.subtotal, invoice.currency)}
            </span>
          </div>
          {invoice.discount && parseFloat(String(invoice.discount)) > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-[13px] text-[#474743] dark:text-[#999]">
                Discount ({invoice.discount}%)
              </span>
              <span className="text-[14px] text-[#141414] dark:text-white">
                - {formatSwissCurrency(
                  invoice.subtotal * (parseFloat(String(invoice.discount)) / 100),
                  invoice.currency
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#474743] dark:text-[#999]">VAT</span>
            <span className="text-[14px] text-[#141414] dark:text-white">
              {formatSwissCurrency(invoice.vat_amount, invoice.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#e0e0e0] dark:border-[#333]">
            <span className="text-[14px] font-medium text-[#141414] dark:text-white">Total (incl. VAT)</span>
            <span className="text-[20px] font-semibold text-[#141414] dark:text-white">
              {formatSwissCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mt-8 pt-6 border-t border-[#e0e0e0] dark:border-[#333]">
        <p className="text-[13px] font-medium text-[#474743] dark:text-[#999] mb-2">Payment Information</p>
        <p className="text-[14px] text-[#141414] dark:text-white">Payment Method: {invoice.payment_method}</p>
        {invoice.from_info.iban && (
          <p className="text-[14px] text-[#141414] dark:text-white">IBAN: {invoice.from_info.iban}</p>
        )}
        <p className="text-[14px] text-[#141414] dark:text-white">Reference: {invoice.invoice_number}</p>
      </div>
    </div>
  )
}

