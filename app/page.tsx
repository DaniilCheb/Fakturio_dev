'use client'

import React, { useState, useEffect } from 'react'
import { GuestInvoice, FromInfo, ToInfo, InvoiceItem } from '@/lib/types/invoice'
import { getNextInvoiceNumber, generateInvoiceId } from '@/lib/utils/invoiceNumber'
import { getCurrentDateISO, calculateDueDate } from '@/lib/utils/dateUtils'
import { calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { validateInvoice, ValidationErrors } from '@/lib/utils/invoiceValidation'
import { generateInvoicePDF } from '@/lib/services/pdfService'
import InvoiceHeader from './components/invoice/InvoiceHeader'
import FromSection from './components/invoice/FromSection'
import ToSection from './components/invoice/ToSection'
import DescriptionSection from './components/invoice/DescriptionSection'
import ProductsSection from './components/invoice/ProductsSection'
import SaveInvoiceModal from './components/invoice/SaveInvoiceModal'
import PreviewModal from './components/invoice/PreviewModal'
import GuestSidebar from './components/GuestSidebar'
import { PreviewIcon, SaveIcon } from './components/Icons'

export default function Home() {
  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issuedOn, setIssuedOn] = useState(getCurrentDateISO())
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [paymentMethod, setPaymentMethod] = useState<'Bank' | 'Card' | 'Cash' | 'Other'>('Bank')
  
  const [fromInfo, setFromInfo] = useState<FromInfo>({
    name: '',
    street: '',
    zip: '8037 Zurich',
    iban: 'CH93 0076 2011 6238 5295 7'
  })
  
  const [toInfo, setToInfo] = useState<ToInfo>({
    uid: 'CHE-123.456.789',
    name: 'Company AG',
    address: 'Bucheggstrasse 21',
    zip: '8037 Zurich'
  })
  
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: generateInvoiceId(),
      quantity: '',
      um: '',
      description: '',
      pricePerUm: '',
      vat: '8.1'
    }
  ])
  const [discount, setDiscount] = useState<number | string>(0)
  
  // UI state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<GuestInvoice | null>(null)

  // Initialize invoice number and due date
  useEffect(() => {
    if (!invoiceNumber) {
      setInvoiceNumber(getNextInvoiceNumber())
    }
  }, [])

  useEffect(() => {
    if (!dueDate && issuedOn) {
      const calculated = calculateDueDate(issuedOn, '14 days')
      setDueDate(calculated)
    }
  }, [issuedOn])

  // Recalculate totals when items or discount change
  useEffect(() => {
    if (items.length > 0) {
      setIsCalculating(true)
      // Trigger a re-render by updating state
      setTimeout(() => setIsCalculating(false), 0)
    }
  }, [items, discount])

  const handleHeaderChange = (field: string, value: string) => {
    switch (field) {
      case 'invoice_number':
        setInvoiceNumber(value)
        break
      case 'issued_on':
        setIssuedOn(value)
        if (dueDate && issuedOn) {
          const days = Math.ceil((new Date(dueDate).getTime() - new Date(issuedOn).getTime()) / (1000 * 60 * 60 * 24))
          if (days > 0) {
            setDueDate(calculateDueDate(value, `${days} days`))
          } else {
            setDueDate(calculateDueDate(value, '14 days'))
          }
        } else {
          setDueDate(calculateDueDate(value, '14 days'))
        }
        break
      case 'due_date':
        setDueDate(value)
        break
      case 'currency':
        setCurrency(value)
        break
      case 'payment_method':
        setPaymentMethod(value as 'Bank' | 'Card' | 'Cash' | 'Other')
        break
    }
  }

  const buildInvoice = (): Partial<GuestInvoice> => {
    const totals = calculateGrandTotal(items, discount)
    
    return {
      invoice_number: invoiceNumber,
      issued_on: issuedOn,
      due_date: dueDate,
      currency,
      payment_method: paymentMethod,
      from_info: fromInfo,
      to_info: toInfo,
      description,
      items,
      discount: parseFloat(String(discount)) || 0,
      subtotal: totals.subtotal,
      vat_amount: totals.vatAmount,
      total: totals.total
    }
  }

  const handlePreview = () => {
    const invoice = buildInvoice()
    const validation = validateInvoice(invoice)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setValidationErrors({})
    // Build full invoice for preview
    const fullInvoice: GuestInvoice = {
      id: generateInvoiceId(),
      ...invoice as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setPreviewInvoice(fullInvoice)
    setShowPreviewModal(true)
  }

  const handleSave = () => {
    const invoice = buildInvoice()
    const validation = validateInvoice(invoice)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setValidationErrors({})
    setShowSaveModal(true)
  }

  const handleDownload = async () => {
    const invoice = buildInvoice()
    const validation = validateInvoice(invoice)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      setShowSaveModal(false)
      return
    }
    
    try {
      const fullInvoice: GuestInvoice = {
        id: generateInvoiceId(),
        ...invoice as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      await generateInvoicePDF(fullInvoice)
      setShowSaveModal(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handlePreviewDownload = async () => {
    if (previewInvoice) {
      try {
        await generateInvoicePDF(previewInvoice)
        setShowPreviewModal(false)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Failed to generate PDF. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f3] dark:bg-[#141414] flex">
      {/* Sidebar */}
      <GuestSidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-[292px] ml-0 pt-7 px-6 pb-8">
        <div className="max-w-[750px]">
          {/* Header */}
          <div className="mb-9">
            <h1 className="text-[32px] font-semibold text-[#141414] dark:text-white tracking-[-0.512px]">
              Create an invoice in less than 2 minutes
            </h1>
          </div>

          {/* Invoice Form Sections */}
          <div className="flex flex-col gap-8">
            {/* Invoice Header Card */}
            <div className="bg-white dark:bg-[#252525] border border-[#e0e0e0] dark:border-[#333] rounded-2xl p-5">
              <InvoiceHeader
                invoiceNumber={invoiceNumber}
                issuedOn={issuedOn}
                dueDate={dueDate}
                currency={currency}
                paymentMethod={paymentMethod}
                onChange={handleHeaderChange}
                errors={validationErrors}
              />
            </div>

            {/* From and To Sections */}
            <div className="flex gap-8">
              <div className="flex-1">
                <FromSection
                  fromInfo={fromInfo}
                  onChange={setFromInfo}
                  errors={validationErrors}
                />
              </div>
              <div className="flex-1">
                <ToSection
                  toInfo={toInfo}
                  onChange={setToInfo}
                  errors={validationErrors}
                />
              </div>
            </div>

            {/* Description Section */}
            <DescriptionSection
              description={description}
              onChange={setDescription}
            />

            {/* Products Section */}
            <ProductsSection
              items={items}
              discount={discount}
              currency={currency}
              onChangeItems={setItems}
              onChangeDiscount={setDiscount}
              errors={validationErrors}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <button
                onClick={handlePreview}
                className="px-6 py-3 border border-[rgba(20,20,20,0.4)] rounded-full text-[16px] text-[#141414] dark:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#333] transition-colors"
              >
                Preview
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-[#141414] dark:bg-white text-white dark:text-[#141414] rounded-full text-[16px] hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SaveInvoiceModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onDownload={handleDownload}
      />

      {previewInvoice && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewInvoice(null)
          }}
          invoice={previewInvoice}
          onDownload={handlePreviewDownload}
        />
      )}
    </div>
  )
}
