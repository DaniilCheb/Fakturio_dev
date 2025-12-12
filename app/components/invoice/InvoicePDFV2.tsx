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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 32,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  // Header Section
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 160,
    height: 48,
    backgroundColor: 'rgba(21,21,20,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#151514',
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyInfoText: {
    fontSize: 10,
    color: '#5e6470',
    lineHeight: 1.4,
  },
  fromCompanyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#151514',
    marginTop: 8,
    marginBottom: 16,
  },
  // Billed To Section
  billedToSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
    marginBottom: 4,
  },
  billedToName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
    marginBottom: 2,
  },
  billedToText: {
    fontSize: 10,
    color: '#5e6470',
    lineHeight: 1.4,
  },
  // Date Info Box
  dateInfoContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dateInfoBox: {
    backgroundColor: '#f7f5f3',
    padding: 10,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    width: 280,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  invoiceNumberBox: {
    padding: 10,
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
  // Items Table
  tableContainer: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 500,
    color: '#5e6470',
  },
  tableRow: {
    flexDirection: 'row',
  },
  itemDescColumn: {
    flex: 1,
  },
  itemRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemText: {
    fontSize: 10,
    fontWeight: 500,
    color: '#1a1c21',
  },
  itemValuesColumn: {
    width: 282,
    backgroundColor: '#f7f5f3',
  },
  itemValuesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  qtyColumn: {
    width: 50,
  },
  rateColumn: {
    width: 85,
    textAlign: 'right',
  },
  amountColumn: {
    width: 85,
    textAlign: 'right',
  },
  // Totals Section
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    textAlign: 'right',
  },
  totalsDivider: {
    marginHorizontal: 16,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  // Total Due Bar
  totalDueBar: {
    backgroundColor: '#151514',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
  },
  footerText: {
    fontSize: 10,
    color: '#5e6470',
  },
  // QR Code
  qrSection: {
    position: 'absolute',
    bottom: 20,
    right: 32,
    alignItems: 'center',
  },
  qrImage: {
    width: 80,
    height: 80,
  },
  qrText: {
    fontSize: 8,
    color: '#5e6470',
    marginTop: 4,
  },
})

interface InvoicePDFV2Props {
  invoice: GuestInvoice
  includeQRCode?: boolean
  qrCodeDataUrl?: string
}

export default function InvoicePDFV2({ invoice, includeQRCode, qrCodeDataUrl }: InvoicePDFV2Props) {
  // Calculate tax rate from first item or use default
  const taxRate = invoice.items.length > 0 
    ? (parseFloat(String(invoice.items[0].vat)) || 10) 
    : 10

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          {/* Logo Placeholder */}
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Customer logo</Text>
          </View>
          
          {/* Company Info on Right */}
          <View style={styles.companyInfo}>
            <Text style={styles.companyInfoText}>{invoice.from_info.name || 'Company name'}</Text>
            <Text style={styles.companyInfoText}>Your name</Text>
            <Text style={styles.companyInfoText}>{invoice.from_info.street || 'Street'}</Text>
            <Text style={styles.companyInfoText}>{invoice.from_info.zip || 'ZIP/City'}</Text>
            {invoice.from_info.iban && <Text style={styles.companyInfoText}>{invoice.from_info.iban}</Text>}
            <Text style={styles.companyInfoText}>Telephone</Text>
            <Text style={styles.companyInfoText}>email</Text>
            <Text style={styles.companyInfoText}>website</Text>
          </View>
        </View>

        {/* From Company Name */}
        <Text style={styles.fromCompanyName}>
          {invoice.from_info.name || 'From-company name'}
        </Text>

        {/* Billed To Section */}
        <View style={styles.billedToSection}>
          <Text style={styles.sectionLabel}>Billed to</Text>
          <Text style={styles.billedToName}>{invoice.to_info.name || 'To Company Name'}</Text>
          <Text style={styles.billedToText}>{invoice.to_info.address || 'Address'}</Text>
          <Text style={styles.billedToText}>{invoice.to_info.zip || 'Zip/City'}</Text>
          <Text style={styles.billedToText}>Telephone</Text>
          <Text style={styles.billedToText}>Email</Text>
        </View>

        {/* Date Info Box */}
        <View style={styles.dateInfoContainer}>
          <View style={styles.dateInfoBox}>
            <View>
              <Text style={styles.dateLabel}>Due date</Text>
              <Text style={styles.dateValue}>{formatDateFigma(invoice.due_date) || '15 Aug, 2023'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dateLabel}>Issued</Text>
              <Text style={styles.dateValue}>{formatDateFigma(invoice.issued_on) || '1 Aug, 2023'}</Text>
            </View>
          </View>
          <View style={styles.invoiceNumberBox}>
            <Text style={styles.dateLabel}>Invoice number</Text>
            <Text style={styles.dateValue}>#{invoice.invoice_number || 'AB2324-01'}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Item description</Text>
            <Text style={[styles.tableHeaderCell, { width: 50 }]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { width: 85, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, { width: 85, textAlign: 'right' }]}>Amount</Text>
          </View>

          {/* Table Rows */}
          <View style={styles.tableRow}>
            {/* Description Column */}
            <View style={styles.itemDescColumn}>
              {invoice.items.length > 0 ? (
                invoice.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item.description || 'Item Name'}</Text>
                  </View>
                ))
              ) : (
                <>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemText}>Item Name</Text>
                  </View>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemText}>Item Name</Text>
                  </View>
                </>
              )}
            </View>

            {/* Values Column with beige background */}
            <View style={styles.itemValuesColumn}>
              {invoice.items.length > 0 ? (
                invoice.items.map((item, index) => {
                  const itemTotal = calculateItemTotal(item)
                  const rate = parseFloat(String(item.pricePerUm)) || 0
                  const qty = parseFloat(String(item.quantity)) || 0
                  
                  return (
                    <View key={index} style={styles.itemValuesRow}>
                      <Text style={[styles.itemText, { width: 50 }]}>{qty}</Text>
                      <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>
                        {formatCurrencyDisplay(rate, invoice.currency)}
                      </Text>
                      <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>
                        {formatCurrencyDisplay(itemTotal, invoice.currency)}
                      </Text>
                    </View>
                  )
                })
              ) : (
                <>
                  <View style={styles.itemValuesRow}>
                    <Text style={[styles.itemText, { width: 50 }]}>1</Text>
                    <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>$3,000.00</Text>
                    <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>$3,000.00</Text>
                  </View>
                  <View style={styles.itemValuesRow}>
                    <Text style={[styles.itemText, { width: 50 }]}>1</Text>
                    <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>$1,500.00</Text>
                    <Text style={[styles.itemText, { width: 85, textAlign: 'right' }]}>$1,500.00</Text>
                  </View>
                </>
              )}

              {/* Divider */}
              <View style={styles.totalsDivider} />

              {/* Subtotal */}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyDisplay(invoice.subtotal, invoice.currency)}
                </Text>
              </View>

              {/* Tax */}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyDisplay(invoice.vat_amount, invoice.currency)}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.totalsDivider} />

              {/* Total */}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total</Text>
                <Text style={styles.totalsValue}>
                  {formatCurrencyDisplay(invoice.total, invoice.currency)}
                </Text>
              </View>

              {/* Total Due Bar */}
              <View style={styles.totalDueBar}>
                <Text style={styles.totalDueLabel}>Total Due</Text>
                <Text style={styles.totalDueValue}>
                  {invoice.currency === 'USD' || invoice.currency === 'US$' ? 'US$' : invoice.currency}{' '}
                  {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Created with Fakturio.ch</Text>
        </View>

        {/* QR Code (if enabled) */}
        {includeQRCode && qrCodeDataUrl && (
          <View style={styles.qrSection}>
            <Image style={styles.qrImage} src={qrCodeDataUrl} />
            <Text style={styles.qrText}>Swiss QR Payment</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

