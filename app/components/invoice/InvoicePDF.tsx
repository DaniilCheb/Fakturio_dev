'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { GuestInvoice } from '@/lib/types/invoice'
import { calculateItemTotal } from '@/lib/utils/invoiceCalculations'
import { format, parseISO } from 'date-fns'

// NOTE: Font registration is handled in pdfService.tsx with proper base64 conversion
// Do NOT register fonts here as browser-mode react-pdf doesn't support URL sources

// Format date: "15 Aug, 2023"
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date
    return format(dateObj, 'd MMM, yyyy')
  } catch {
    return '—'
  }
}

// Format currency with proper symbol
function formatCurrency(value: number | string | undefined | null, currency: string = 'CHF'): string {
  if (value === undefined || value === null || value === '') return formatCurrency(0, currency)
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return formatCurrency(0, currency)
  
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  
  const symbols: Record<string, string> = {
    'USD': '$',
    'US$': '$',
    'EUR': '€',
    'GBP': '£',
    'CHF': 'CHF ',
  }
  
  const symbol = symbols[currency] || `${currency} `
  return `${symbol}${formatted}`
}

// Fakturio Design System Colors
const colors = {
  // Backgrounds
  background: '#f7f5f3',
  surface: '#ffffff',
  surfaceField: '#f5f5f3',
  surfaceInverted: '#141414',
  
  // Content (Text)
  contentDefault: '#141414',
  contentWeak: '#434343',
  contentWeakest: '#666666',
  
  // Borders
  borderDefault: '#e0e0e0',
  borderLight: '#f0f0f0',
}

// Styles following Fakturio Design System
// Using Helvetica as default (built-in to react-pdf) with Radio Canada Big as enhancement when registered
const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.surface,
    fontFamily: 'Helvetica', // Use built-in Helvetica - Radio Canada Big registration is handled by pdfService
    padding: 40,
    fontSize: 10,
    color: colors.contentDefault,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 600,
    letterSpacing: -0.5,
    color: colors.contentDefault,
  },
  invoiceNumber: {
    fontSize: 13,
    color: colors.contentWeak,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  
  // Meta info (dates) - styled like Fakturio labels
  metaRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentWeakest,
    width: 50,
    textAlign: 'right',
    marginRight: 8,
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentDefault,
  },
  
  // Parties section (from/to)
  partiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  party: {
    width: '45%',
  },
  partyLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentWeakest,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyName: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.contentDefault,
    marginBottom: 4,
  },
  partyText: {
    fontSize: 10,
    color: colors.contentWeak,
    lineHeight: 1.5,
  },
  
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceField,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentWeakest,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableCell: {
    fontSize: 10,
    fontWeight: 400,
    color: colors.contentDefault,
  },
  
  // Column widths
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: 'center' },
  colRate: { width: 80, textAlign: 'right' },
  colAmount: { width: 90, textAlign: 'right' },
  
  // Totals
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  totals: {
    width: 240,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 400,
    color: colors.contentWeak,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentDefault,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceInverted,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: colors.surface,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 600,
    color: colors.surface,
  },
  
  // Payment info
  paymentSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  paymentLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentWeakest,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentKey: {
    fontSize: 10,
    color: colors.contentWeak,
    width: 100,
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: 500,
    color: colors.contentDefault,
  },
  
  // QR Code
  qrContainer: {
    position: 'absolute',
    right: 40,
    bottom: 100,
    alignItems: 'center',
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrLabel: {
    fontSize: 8,
    color: colors.contentWeakest,
    marginTop: 6,
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    fontSize: 9,
    color: colors.contentWeakest,
  },
})

interface InvoicePDFProps {
  invoice: GuestInvoice
  includeQRCode?: boolean
  qrCodeDataUrl?: string
}

export default function InvoicePDF({ invoice, includeQRCode, qrCodeDataUrl }: InvoicePDFProps) {
  const items = invoice.items || []
  const taxRate = items.length > 0 
    ? (parseFloat(String(items[0].vat)) || 0) 
    : 0
  const discountRate = parseFloat(String(invoice.discount)) || 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Invoice</Text>
            <Text style={styles.invoiceNumber}>
              #{invoice.invoice_number}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Issued</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.issued_on)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due</Text>
              <Text style={styles.metaValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        {/* From / To */}
        <View style={styles.partiesRow}>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>From</Text>
            {invoice.from_info.company_name ? (
              <>
                <Text style={styles.partyName}>{invoice.from_info.company_name}</Text>
                {invoice.from_info.name && (
                  <Text style={styles.partyText}>{invoice.from_info.name}</Text>
                )}
              </>
            ) : (
              <Text style={styles.partyName}>{invoice.from_info.name}</Text>
            )}
            <Text style={styles.partyText}>{invoice.from_info.street}</Text>
            <Text style={styles.partyText}>{invoice.from_info.zip}</Text>
            {invoice.from_info.uid && (
              <Text style={[styles.partyText, { marginTop: 4 }]}>UID/VAT number: {invoice.from_info.uid}</Text>
            )}
          </View>
          <View style={styles.party}>
            <Text style={styles.partyLabel}>Bill To</Text>
            <Text style={styles.partyName}>{invoice.to_info.name}</Text>
            <Text style={styles.partyText}>{invoice.to_info.address}</Text>
            <Text style={styles.partyText}>{invoice.to_info.zip}</Text>
            {invoice.to_info.uid && (
              <Text style={[styles.partyText, { marginTop: 4 }]}>UID/VAT number: {invoice.to_info.uid}</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>
          
          {/* Rows */}
          {items.map((item, index) => {
            const qty = parseFloat(String(item.quantity)) || 0
            const rate = parseFloat(String(item.pricePerUm)) || 0
            const itemTotal = calculateItemTotal(item)
            
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{qty}</Text>
                <Text style={[styles.tableCell, styles.colRate]}>
                  {formatCurrency(rate, invoice.currency)}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(itemTotal, invoice.currency)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </Text>
            </View>
            
            {taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>VAT ({taxRate}%)</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.vat_amount, invoice.currency)}
                </Text>
              </View>
            )}
            
            {discountRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount ({discountRate}%)</Text>
                <Text style={styles.totalValue}>
                  −{formatCurrency((invoice.subtotal * discountRate) / 100, invoice.currency)}
                </Text>
              </View>
            )}
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.total, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.paymentSection}>
          <Text style={styles.paymentLabel}>Payment Details</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Method</Text>
            <Text style={styles.paymentValue}>{invoice.payment_method}</Text>
          </View>
          {invoice.from_info.iban && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentKey}>IBAN</Text>
              <Text style={styles.paymentValue}>{invoice.from_info.iban}</Text>
            </View>
          )}
          <View style={styles.paymentRow}>
            <Text style={styles.paymentKey}>Reference</Text>
            <Text style={styles.paymentValue}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Swiss QR Code */}
        {includeQRCode && qrCodeDataUrl && (
          <View style={styles.qrContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.qrImage} src={qrCodeDataUrl} />
            <Text style={styles.qrLabel}>Swiss QR Payment</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Created with Fakturio.ch
          </Text>
          <Text style={styles.footerText}>
            Page 1
          </Text>
        </View>
      </Page>
    </Document>
  )
}
