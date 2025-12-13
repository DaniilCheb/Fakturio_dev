'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { GuestInvoice } from '@/lib/types/invoice'
import { calculateItemTotal } from '@/lib/utils/invoiceCalculations'
import { format, parseISO } from 'date-fns'

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

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Radio Canada Big',
    position: 'relative',
    width: 595,
    height: 842,
  },
  // Beige backgrounds
  tableBeigeBg: {
    position: 'absolute',
    left: 297,
    top: 294,
    width: 282,
    height: 194,
    backgroundColor: '#f7f5f3',
  },
  dateInfoBox: {
    position: 'absolute',
    left: 16,
    top: 242,
    width: 281,
    height: 52,
    backgroundColor: '#f7f5f3',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  // Due date
  dueDateSection: {
    position: 'absolute',
    right: 499,
    top: 252,
  },
  // Issued
  issuedSection: {
    position: 'absolute',
    right: 314,
    top: 252,
    alignItems: 'flex-end',
  },
  // Invoice number
  invoiceNumberSection: {
    position: 'absolute',
    left: 313,
    top: 252,
  },
  // Labels and values
  label: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    marginBottom: 4,
  },
  labelRight: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    marginBottom: 4,
    textAlign: 'right',
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
  },
  valueRight: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
    textAlign: 'right',
  },
  // Billed from
  billedFromSection: {
    position: 'absolute',
    left: 32,
    top: 103,
  },
  // Billed to
  billedToSection: {
    position: 'absolute',
    left: 313,
    top: 103,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    marginBottom: 4,
  },
  sectionName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
    marginBottom: 2,
  },
  sectionText: {
    fontSize: 10,
    color: '#5e6470',
    marginBottom: 2,
  },
  // Payment information
  paymentSection: {
    position: 'absolute',
    left: 32,
    top: 603,
  },
  // Table headers
  headerItemDesc: {
    position: 'absolute',
    left: 32,
    top: 304,
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
  },
  headerQty: {
    position: 'absolute',
    left: 313,
    top: 304,
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
  },
  headerRate: {
    position: 'absolute',
    left: 412,
    top: 304,
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    textAlign: 'right',
    width: 36,
  },
  headerAmount: {
    position: 'absolute',
    left: 512,
    top: 304,
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    textAlign: 'right',
    width: 51,
  },
  // Divider lines
  dividerFull: {
    position: 'absolute',
    left: 32,
    width: 531,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerShort: {
    position: 'absolute',
    left: 313,
    width: 250,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  // Item text styles
  itemDesc: {
    position: 'absolute',
    left: 32,
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  itemQty: {
    position: 'absolute',
    left: 313,
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  itemRate: {
    position: 'absolute',
    left: 412,
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
    textAlign: 'right',
    width: 36,
  },
  itemAmount: {
    position: 'absolute',
    right: 32,
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
    textAlign: 'right',
  },
  // Totals
  totalsLabel: {
    position: 'absolute',
    left: 313,
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  totalsValue: {
    position: 'absolute',
    left: 512,
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
    textAlign: 'right',
    width: 51,
  },
  // Total Due bar
  totalDueBar: {
    position: 'absolute',
    left: 297,
    top: 488,
    width: 282,
    height: 40,
    backgroundColor: '#151514',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  totalDueLabel: {
    position: 'absolute',
    left: 313,
    top: 501,
    fontSize: 10,
    fontWeight: 500,
    color: '#ffffff',
  },
  totalDueValue: {
    position: 'absolute',
    right: 32,
    top: 498,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    letterSpacing: 0.24,
  },
  // Footer
  footerText: {
    position: 'absolute',
    left: 32,
    top: 521,
    fontSize: 10,
    color: '#5e6470',
  },
  // QR Code section
  qrSection: {
    position: 'absolute',
    right: 32,
    top: 580,
    alignItems: 'center',
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrText: {
    fontSize: 8,
    color: '#5e6470',
    marginTop: 4,
    textAlign: 'center',
  },
  qrPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#cccccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    fontSize: 10,
    color: '#999999',
  },
})

interface InvoicePDFProps {
  invoice: GuestInvoice
  includeQRCode?: boolean
  qrCodeDataUrl?: string
}

export default function InvoicePDF({ invoice, includeQRCode, qrCodeDataUrl }: InvoicePDFProps) {
  // Calculate tax rate from first item or use default
  const taxRate = invoice.items.length > 0 
    ? (parseFloat(String(invoice.items[0].vat)) || 10) 
    : 10

  const itemRowHeight = 34
  const items = invoice.items.length > 0 ? invoice.items : []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Beige background for table values area */}
        <View style={styles.tableBeigeBg} />

        {/* Date info beige box */}
        <View style={styles.dateInfoBox} />

        {/* Due date */}
        <View style={styles.dueDateSection}>
          <Text style={styles.label}>Due date</Text>
          <Text style={styles.value}>{formatDateFigma(invoice.due_date) || '15 Aug, 2023'}</Text>
        </View>

        {/* Issued */}
        <View style={styles.issuedSection}>
          <Text style={styles.labelRight}>Issued</Text>
          <Text style={styles.valueRight}>{formatDateFigma(invoice.issued_on) || '1 Aug, 2023'}</Text>
        </View>

        {/* Invoice number */}
        <View style={styles.invoiceNumberSection}>
          <Text style={styles.label}>Invoice number</Text>
          <Text style={styles.value}>#{invoice.invoice_number || 'AB2324-01'}</Text>
        </View>

        {/* Billed to */}
        <View style={styles.billedToSection}>
          <Text style={styles.sectionLabel}>Billed to</Text>
          <Text style={styles.sectionName}>{invoice.to_info.name || 'To Company Name'}</Text>
          <Text style={styles.sectionText}>{invoice.to_info.address || 'Address'}</Text>
          <Text style={styles.sectionText}>{invoice.to_info.zip || 'Zip/City'}</Text>
          <Text style={styles.sectionText}>Telephone</Text>
          <Text style={styles.sectionText}>Email</Text>
        </View>

        {/* Billed from */}
        <View style={styles.billedFromSection}>
          <Text style={styles.sectionLabel}>Billed from</Text>
          <Text style={styles.sectionName}>{invoice.from_info.name || 'From Company Name'}</Text>
          <Text style={styles.sectionText}>{invoice.from_info.street || 'Address'}</Text>
          <Text style={styles.sectionText}>{invoice.from_info.zip || 'Zip/City'}</Text>
          <Text style={styles.sectionText}>Telephone</Text>
          <Text style={styles.sectionText}>Email</Text>
        </View>

        {/* Payment information */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionLabel}>Payment information</Text>
          <Text style={styles.sectionName}>{invoice.from_info.iban || 'IBAN'}</Text>
          <Text style={styles.sectionText}>Payment method: {invoice.payment_method}</Text>
        </View>

        {/* Table headers */}
        <Text style={styles.headerItemDesc}>Item description</Text>
        <Text style={styles.headerQty}>Qty</Text>
        <Text style={styles.headerRate}>Rate</Text>
        <Text style={styles.headerAmount}>Amount</Text>

        {/* Divider after header */}
        <View style={[styles.dividerFull, { top: 328 }]} />

        {/* Item rows */}
        {items.length > 0 ? (
          items.map((item, index) => {
            const itemTotal = calculateItemTotal(item)
            const rate = parseFloat(String(item.pricePerUm)) || 0
            const qty = parseFloat(String(item.quantity)) || 0
            const rowTop = 338 + (index * itemRowHeight)
            const dividerTop = 362 + (index * itemRowHeight)
            
            return (
              <React.Fragment key={index}>
                <Text style={[styles.itemDesc, { top: rowTop }]}>{item.description || 'Item Name'}</Text>
                <Text style={[styles.itemQty, { top: rowTop }]}>{qty}</Text>
                <Text style={[styles.itemRate, { top: rowTop }]}>{formatCurrencyDisplay(rate, invoice.currency)}</Text>
                <Text style={[styles.itemAmount, { top: rowTop }]}>{formatCurrencyDisplay(itemTotal, invoice.currency)}</Text>
                <View style={[styles.dividerFull, { top: dividerTop }]} />
              </React.Fragment>
            )
          })
        ) : (
          <>
            <Text style={[styles.itemDesc, { top: 338 }]}>Item Name</Text>
            <Text style={[styles.itemQty, { top: 338 }]}>1</Text>
            <Text style={[styles.itemRate, { top: 338 }]}>$3,000.00</Text>
            <Text style={[styles.itemAmount, { top: 338 }]}>$3,000.00</Text>
            <View style={[styles.dividerFull, { top: 362 }]} />
            
            <Text style={[styles.itemDesc, { top: 372 }]}>Item Name</Text>
            <Text style={[styles.itemQty, { top: 372 }]}>1</Text>
            <Text style={[styles.itemRate, { top: 372 }]}>$1,500.00</Text>
            <Text style={[styles.itemAmount, { top: 372 }]}>$1,500.00</Text>
            <View style={[styles.dividerFull, { top: 396 }]} />
          </>
        )}

        {/* Subtotal */}
        <Text style={[styles.totalsLabel, { top: 406 }]}>Subtotal</Text>
        <Text style={[styles.totalsValue, { top: 406 }]}>{formatCurrencyDisplay(invoice.subtotal, invoice.currency)}</Text>

        {/* Tax */}
        <Text style={[styles.totalsLabel, { top: 430 }]}>Tax ({taxRate}%)</Text>
        <Text style={[styles.totalsValue, { top: 430 }]}>{formatCurrencyDisplay(invoice.vat_amount, invoice.currency)}</Text>

        {/* Divider before total */}
        <View style={[styles.dividerShort, { top: 454 }]} />

        {/* Total */}
        <Text style={[styles.totalsLabel, { top: 464 }]}>Total</Text>
        <Text style={[styles.totalsValue, { top: 464 }]}>{formatCurrencyDisplay(invoice.total, invoice.currency)}</Text>

        {/* Total Due bar */}
        <View style={styles.totalDueBar} />
        <Text style={styles.totalDueLabel}>Total Due</Text>
        <Text style={styles.totalDueValue}>
          {invoice.currency === 'USD' || invoice.currency === 'US$' ? 'US$' : invoice.currency}{' '}
          {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Created with Fakturio.ch */}
        <Text style={styles.footerText}>Created with Fakturio.ch</Text>

        {/* QR Code */}
        <View style={styles.qrSection}>
          {includeQRCode && qrCodeDataUrl ? (
            <>
              <Image style={styles.qrImage} src={qrCodeDataUrl} />
              <Text style={styles.qrText}>Swiss QR Payment</Text>
            </>
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrPlaceholderText}>QR Code</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
