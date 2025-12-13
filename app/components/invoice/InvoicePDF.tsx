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
    fontFamily: 'Helvetica',
    padding: 32,
    fontSize: 10,
  },
  // Two column layout for Billed from / Billed to
  billingRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  billingColumn: {
    width: '50%',
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
  // Date info row
  dateInfoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateInfoBox: {
    backgroundColor: '#f7f5f3',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 280,
  },
  dateColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  dateColumnRight: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  invoiceNumberBox: {
    padding: 12,
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
  },
  // Table
  tableContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  colDescription: {
    flex: 1,
  },
  colQty: {
    width: 60,
    backgroundColor: '#f7f5f3',
    paddingHorizontal: 8,
  },
  colRate: {
    width: 100,
    backgroundColor: '#f7f5f3',
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  colAmount: {
    width: 100,
    backgroundColor: '#f7f5f3',
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
  },
  cellText: {
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  // Totals section
  totalsContainer: {
    flexDirection: 'row',
  },
  totalsLeftSpace: {
    flex: 1,
  },
  totalsRightColumn: {
    width: 260,
    backgroundColor: '#f7f5f3',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  totalsLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  totalsDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  // Total Due bar
  totalDueBar: {
    backgroundColor: '#151514',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  totalDueLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#ffffff',
  },
  totalDueValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.24,
  },
  // Footer
  footerText: {
    fontSize: 10,
    color: '#5e6470',
    marginTop: 16,
    marginBottom: 24,
  },
  // Bottom section
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentSection: {},
  paymentLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    marginBottom: 4,
  },
  paymentIban: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 10,
    color: '#5e6470',
  },
  // QR Code
  qrSection: {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Billed from / Billed to */}
        <View style={styles.billingRow}>
          <View style={styles.billingColumn}>
            <Text style={styles.sectionLabel}>Billed from</Text>
            <Text style={styles.sectionName}>{invoice.from_info.name || 'Company Name'}</Text>
            <Text style={styles.sectionText}>{invoice.from_info.street || 'Address'}</Text>
            <Text style={styles.sectionText}>{invoice.from_info.zip || 'Zip/City'}</Text>
            <Text style={styles.sectionText}>Telephone</Text>
            <Text style={styles.sectionText}>Email</Text>
          </View>
          <View style={styles.billingColumn}>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text style={styles.sectionName}>{invoice.to_info.name || 'Company Name'}</Text>
            <Text style={styles.sectionText}>{invoice.to_info.address || 'Address'}</Text>
            <Text style={styles.sectionText}>{invoice.to_info.zip || 'Zip/City'}</Text>
            <Text style={styles.sectionText}>Telephone</Text>
            <Text style={styles.sectionText}>Email</Text>
          </View>
        </View>

        {/* Date info row */}
        <View style={styles.dateInfoRow}>
          <View style={styles.dateInfoBox}>
            <View style={styles.dateColumn}>
              <Text style={styles.dateLabel}>Due date</Text>
              <Text style={styles.dateValue}>{formatDateFigma(invoice.due_date) || '15 Aug, 2023'}</Text>
            </View>
            <View style={styles.dateColumnRight}>
              <Text style={styles.dateLabel}>Issued</Text>
              <Text style={styles.dateValue}>{formatDateFigma(invoice.issued_on) || '1 Aug, 2023'}</Text>
            </View>
          </View>
          <View style={styles.invoiceNumberBox}>
            <Text style={styles.dateLabel}>Invoice number</Text>
            <Text style={styles.dateValue}>#{invoice.invoice_number || 'AB2324-01'}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.tableContainer}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDescription}>
              <Text style={styles.headerText}>Item description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.headerText}>Qty</Text>
            </View>
            <View style={styles.colRate}>
              <Text style={[styles.headerText, { textAlign: 'right' }]}>Rate</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={[styles.headerText, { textAlign: 'right' }]}>Amount</Text>
            </View>
          </View>

          {/* Item rows */}
          {invoice.items.length > 0 ? (
            invoice.items.map((item, index) => {
              const itemTotal = calculateItemTotal(item)
              const rate = parseFloat(String(item.pricePerUm)) || 0
              const qty = parseFloat(String(item.quantity)) || 0
              
              return (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.colDescription}>
                    <Text style={styles.cellText}>{item.description || 'Item Name'}</Text>
                  </View>
                  <View style={styles.colQty}>
                    <Text style={styles.cellText}>{qty}</Text>
                  </View>
                  <View style={styles.colRate}>
                    <Text style={[styles.cellText, { textAlign: 'right' }]}>{formatCurrencyDisplay(rate, invoice.currency)}</Text>
                  </View>
                  <View style={styles.colAmount}>
                    <Text style={[styles.cellText, { textAlign: 'right' }]}>{formatCurrencyDisplay(itemTotal, invoice.currency)}</Text>
                  </View>
                </View>
              )
            })
          ) : (
            <>
              <View style={styles.tableRow}>
                <View style={styles.colDescription}><Text style={styles.cellText}>Item Name</Text></View>
                <View style={styles.colQty}><Text style={styles.cellText}>1</Text></View>
                <View style={styles.colRate}><Text style={[styles.cellText, { textAlign: 'right' }]}>$3,000.00</Text></View>
                <View style={styles.colAmount}><Text style={[styles.cellText, { textAlign: 'right' }]}>$3,000.00</Text></View>
              </View>
              <View style={styles.tableRow}>
                <View style={styles.colDescription}><Text style={styles.cellText}>Item Name</Text></View>
                <View style={styles.colQty}><Text style={styles.cellText}>1</Text></View>
                <View style={styles.colRate}><Text style={[styles.cellText, { textAlign: 'right' }]}>$1,500.00</Text></View>
                <View style={styles.colAmount}><Text style={[styles.cellText, { textAlign: 'right' }]}>$1,500.00</Text></View>
              </View>
            </>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsLeftSpace} />
          <View style={styles.totalsRightColumn}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrencyDisplay(invoice.subtotal, invoice.currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({taxRate}%)</Text>
              <Text style={styles.totalsValue}>{formatCurrencyDisplay(invoice.vat_amount, invoice.currency)}</Text>
            </View>
            <View style={styles.totalsDivider} />
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total</Text>
              <Text style={styles.totalsValue}>{formatCurrencyDisplay(invoice.total, invoice.currency)}</Text>
            </View>
            <View style={styles.totalDueBar}>
              <Text style={styles.totalDueLabel}>Total Due</Text>
              <Text style={styles.totalDueValue}>
                {invoice.currency === 'USD' || invoice.currency === 'US$' ? 'US$' : invoice.currency}{' '}
                {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>Created with Fakturio.ch</Text>

        {/* Bottom section: Payment info + QR Code */}
        <View style={styles.bottomSection}>
          <View style={styles.paymentSection}>
            <Text style={styles.paymentLabel}>Payment information</Text>
            <Text style={styles.paymentIban}>{invoice.from_info.iban || 'IBAN'}</Text>
            <Text style={styles.paymentMethod}>Payment method: {invoice.payment_method}</Text>
          </View>

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
        </View>
      </Page>
    </Document>
  )
}
