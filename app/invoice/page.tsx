'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { GuestInvoice } from '@/lib/types/invoice'
import { calculateGrandTotal } from '@/lib/utils/invoiceCalculations'
import { generateInvoicePDFBlob } from '@/lib/services/pdfService'

// Mock invoice items for template preview
const mockItems = [
  {
    id: '1',
    quantity: 10,
    um: 1,
    description: 'Web Development Services',
    pricePerUm: 150.00,
    vat: 7.7,
  },
  {
    id: '2',
    quantity: 5,
    um: 1,
    description: 'Design Consultation',
    pricePerUm: 120.00,
    vat: 7.7,
  },
  {
    id: '3',
    quantity: 8,
    um: 1,
    description: 'Project Management',
    pricePerUm: 100.00,
    vat: 7.7,
  },
]

const discount = 0

export default function InvoiceTemplatePage() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate totals using the same logic as the rest of the app
  const totals = useMemo(() => calculateGrandTotal(mockItems, discount), [])

  // Build mock invoice with calculated totals
  const mockInvoice: GuestInvoice = useMemo(() => ({
    id: 'template-preview',
    invoice_number: 'INV-2024-001',
    issued_on: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'CHF',
    payment_method: 'Bank',
    from_info: {
      name: 'Your Company Name',
      street: '123 Business Street',
      zip: '8001 Zurich, Switzerland',
      iban: 'CH93 0076 2011 6238 5295 7',
      company_name: 'Your Company Name',
    },
    to_info: {
      name: 'Client Company Ltd.',
      address: '456 Client Avenue',
      zip: '1000 Lausanne, Switzerland',
      uid: 'CHE-123.456.789',
    },
    description: 'Sample invoice for template preview',
    items: mockItems,
    discount: discount,
    subtotal: totals.subtotal,
    vat_amount: totals.vatAmount,
    total: totals.total,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }), [totals])

  // Generate PDF blob and create object URL
  useEffect(() => {
    let objectUrl: string | null = null

    const generatePDF = async () => {
      setIsLoading(true)
      try {
        const blob = await generateInvoicePDFBlob(mockInvoice, { includeQRCode: true })
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch (error) {
        console.error('Error generating PDF:', error)
      } finally {
        setIsLoading(false)
      }
    }

    generatePDF()

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [mockInvoice])

  return (
    <div className="min-h-screen bg-[#f7f5f3] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#141414] mb-2">
            Invoice Template Preview
          </h1>
          <p className="text-[#666666] text-sm">
            Preview and tweak the invoice layout. This shows the actual PDF template that gets generated.
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ width: '100%', height: '90vh' }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#141414] mx-auto mb-4"></div>
                  <p className="text-[#666666]">Generating PDF preview...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Invoice PDF Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[#666666]">Failed to load PDF preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

