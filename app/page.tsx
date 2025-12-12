'use client'

import React, { useState, useEffect } from 'react'
import { GuestInvoice, FromInfo, ToInfo, InvoiceItem } from '@/lib/types/invoice'
import { getNextInvoiceNumber, generateInvoiceId } from '@/lib/utils/invoiceNumber'
import { getCurrentDateISO, calculateDueDate } from '@/lib/utils/dateUtils'
import { calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { validateInvoice, ValidationErrors } from '@/lib/utils/invoiceValidation'
import { generateInvoicePDF } from '@/lib/services/pdfService'
import { useInvoiceStorage } from '@/lib/hooks/useInvoiceStorage'
import InvoiceHeader from './components/invoice/InvoiceHeader'
import FromSection from './components/invoice/FromSection'
import ToSection from './components/invoice/ToSection'
import DescriptionSection from './components/invoice/DescriptionSection'
import ProductsSection from './components/invoice/ProductsSection'
import SaveInvoiceModal from './components/invoice/SaveInvoiceModal'
import PreviewModal from './components/invoice/PreviewModal'
import GuestSidebar from './components/GuestSidebar'

export default function Home() {
  // Invoice storage hook (handles localStorage for guests)
  const { saveInvoice: saveToStorage, invoices } = useInvoiceStorage()
  
  // Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issuedOn, setIssuedOn] = useState(getCurrentDateISO())
  const [dueDate, setDueDate] = useState('')
  const [currency, setCurrency] = useState('CHF')
  const [paymentMethod, setPaymentMethod] = useState<'Bank' | 'Card' | 'Cash' | 'Other'>('Bank')
  
  const [fromInfo, setFromInfo] = useState<FromInfo>({
    name: '',
    street: '',
    zip: '',
    iban: ''
  })
  
  const [toInfo, setToInfo] = useState<ToInfo>({
    uid: '',
    name: '',
    address: '',
    zip: ''
  })
  
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: generateInvoiceId(),
      quantity: '',
      um: 'pcs', // Default unit of measure
      description: '',
      pricePerUm: '',
      vat: '0'
    }
  ])
  const [discount, setDiscount] = useState<number | string>(0)
  
  // UI state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isCalculating, setIsCalculating] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<GuestInvoice | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

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
    
    setIsGeneratingPDF(true)
    
    try {
      const fullInvoice: GuestInvoice = {
        id: generateInvoiceId(),
        invoice_number: invoice.invoice_number || '',
        issued_on: invoice.issued_on || '',
        due_date: invoice.due_date || '',
        currency: invoice.currency || 'CHF',
        payment_method: invoice.payment_method || 'Bank',
        from_info: invoice.from_info || { name: '', street: '', zip: '', iban: '' },
        to_info: invoice.to_info || { name: '', address: '', zip: '' },
        description: invoice.description,
        items: invoice.items || [],
        discount: invoice.discount || 0,
        subtotal: invoice.subtotal || 0,
        vat_amount: invoice.vat_amount || 0,
        total: invoice.total || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Generate PDF with Swiss QR code (auto-generated)
      await generateInvoicePDF(fullInvoice, {
        includeQRCode: true
      })
      
      // Try to save to localStorage after successful PDF
      try {
        await saveToStorage({
          invoice_number: fullInvoice.invoice_number,
          issued_on: fullInvoice.issued_on,
          due_date: fullInvoice.due_date,
          currency: fullInvoice.currency,
          payment_method: fullInvoice.payment_method,
          from_info: fullInvoice.from_info,
          to_info: fullInvoice.to_info,
          description: fullInvoice.description,
          items: fullInvoice.items,
          discount: fullInvoice.discount,
          subtotal: fullInvoice.subtotal,
          vat_amount: fullInvoice.vat_amount,
          total: fullInvoice.total
        })
      } catch (saveError) {
        console.warn('Failed to save to localStorage:', saveError)
      }
      
      setSaveSuccess(true)
      setShowSaveModal(false)
      
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handlePreviewDownload = async () => {
    if (previewInvoice) {
      setIsGeneratingPDF(true)
      try {
        // Generate PDF directly without QR code for now
        await generateInvoicePDF(previewInvoice, {
          includeQRCode: false,
          qrCodeDataUrl: undefined
        })
        
        // Try to save to localStorage after successful PDF
        try {
          await saveToStorage({
            invoice_number: previewInvoice.invoice_number,
            issued_on: previewInvoice.issued_on,
            due_date: previewInvoice.due_date,
            currency: previewInvoice.currency,
            payment_method: previewInvoice.payment_method,
            from_info: previewInvoice.from_info,
            to_info: previewInvoice.to_info,
            description: previewInvoice.description,
            items: previewInvoice.items,
            discount: previewInvoice.discount,
            subtotal: previewInvoice.subtotal,
            vat_amount: previewInvoice.vat_amount,
            total: previewInvoice.total
          })
        } catch (saveError) {
          console.warn('Failed to save to localStorage:', saveError)
        }
        
        setSaveSuccess(true)
        setShowPreviewModal(false)
        setPreviewInvoice(null)
        
        setTimeout(() => {
          setSaveSuccess(false)
        }, 3000)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setIsGeneratingPDF(false)
      }
    }
  }

  // Handle save only (without download)
  const handleSaveOnly = async () => {
    const invoice = buildInvoice()
    const validation = validateInvoice(invoice)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }
    
    setIsSaving(true)
    
    try {
      // Save to localStorage
      await saveToStorage({
        invoice_number: invoice.invoice_number || '',
        issued_on: invoice.issued_on || '',
        due_date: invoice.due_date || '',
        currency: invoice.currency || 'CHF',
        payment_method: invoice.payment_method || 'Bank',
        from_info: invoice.from_info || { name: '', street: '', zip: '', iban: '' },
        to_info: invoice.to_info || { name: '', address: '', zip: '' },
        description: invoice.description,
        items: invoice.items || [],
        discount: invoice.discount || 0,
        subtotal: invoice.subtotal || 0,
        vat_amount: invoice.vat_amount || 0,
        total: invoice.total || 0
      })
      
      setSaveSuccess(true)
      setShowSaveModal(false)
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
    } catch (error) {
      console.error('Error saving invoice:', error)
      alert(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-design-background flex">
      {/* Sidebar */}
      <GuestSidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-[292px] ml-0 pt-7 lg:pt-7 pt-20 pb-8 w-full">
        <div className="flex gap-8 h-full">
          {/* Form Section */}
          <div className="flex-1 px-6 lg:px-8 max-w-[800px] mx-auto">
            {/* Header */}
            <div className="mt-[64px] mb-6 sm:mb-9 px-4 sm:px-5">
              <h1 className="text-[30px] leading-[36px] font-semibold text-design-content-default tracking-[-0.512px]">
                Create an invoice in less than 2 minutes
              </h1>
              <p className="text-[15px] text-design-content-default leading-relaxed mt-4 xl:hidden">
                Fakturio is the fastest way for Swiss freelancers to create invoices, track expenses, and stay tax-ready without the accounting headache.
              </p>
            </div>

            {/* Invoice Form Sections */}
            <div className="flex flex-col gap-6 sm:gap-8">
              {/* Invoice Header Card */}
              <div className="bg-design-surface-default border border-design-border-default rounded-2xl p-4 sm:p-5">
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
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
                <button
                  onClick={handlePreview}
                  className="px-6 py-3 border border-design-content-weakest rounded-full text-[16px] text-design-content-default hover:bg-design-surface-field transition-colors w-full sm:w-auto"
                >
                  Preview
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-design-button-primary text-design-on-button-content rounded-full text-[16px] hover:opacity-90 transition-opacity w-full sm:w-auto"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#141414] dark:bg-white text-white dark:text-[#141414] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#22C55E" />
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[14px] font-medium">Invoice saved successfully!</span>
          </div>
        </div>
      )}

      {/* Modals */}
      <SaveInvoiceModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onDownload={handleDownload}
        onSaveOnly={handleSaveOnly}
        isLoading={isGeneratingPDF}
        isSaving={isSaving}
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
