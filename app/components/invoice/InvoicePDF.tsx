'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { GuestInvoice } from '@/lib/types/invoice'
import { formatDateInvoice } from '@/lib/utils/dateUtils'
import { formatSwissCurrency } from '@/lib/utils/formatters'
import { calculateItemTotalWithVAT } from '@/lib/utils/invoiceCalculations'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 32,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  // Logo section
  logoPlaceholder: {
    width: 160,
    height: 48,
    backgroundColor: 'rgba(21, 21, 20, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#151514',
  },
  // Two column layout for Billed from / Billed to
  billingRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  billingColumn: {
    width: '50%',
  },
  // Section styles
  sectionTitle: {
    fontSize: 10,
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
  // Invoice details row
  invoiceDetailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  invoiceDetailsLeft: {
    width: '50%',
    backgroundColor: '#f7f5f3',
    flexDirection: 'row',
    padding: 12,
  },
  invoiceDetailsRight: {
    width: '50%',
    paddingLeft: 16,
    paddingVertical: 12,
  },
  dueDateColumn: {
    width: '50%',
  },
  issuedColumn: {
    width: '50%',
    alignItems: 'flex-end',
  },
  invoiceDetailLabel: {
    fontSize: 10,
    color: '#5e6470',
    marginBottom: 4,
  },
  invoiceDetailValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
  },
  // Main table container
  tableContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  // Left column (Item description) - white background
  tableLeftColumn: {
    width: '50%',
  },
  // Right column (Qty, Rate, Amount + Summary) - beige background
  tableRightColumn: {
    width: '50%',
    backgroundColor: '#f7f5f3',
  },
  // Table header row
  tableHeaderLeft: {
    paddingVertical: 10,
    paddingRight: 16,
  },
  tableHeaderRight: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    fontSize: 10,
    color: '#5e6470',
  },
  headerQty: {
    width: '20%',
  },
  headerRate: {
    width: '40%',
    textAlign: 'right',
  },
  headerAmount: {
    width: '40%',
    textAlign: 'right',
  },
  // Table data rows
  tableRowLeft: {
    paddingVertical: 12,
    paddingRight: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tableRowRight: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  tableCellText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1c21',
  },
  cellQty: {
    width: '20%',
  },
  cellRate: {
    width: '40%',
    textAlign: 'right',
  },
  cellAmount: {
    width: '40%',
    textAlign: 'right',
  },
  // Summary section (inside right column)
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#1a1c21',
    width: '60%',
  },
  summaryValue: {
    fontSize: 10,
    color: '#1a1c21',
    width: '40%',
    textAlign: 'right',
  },
  // Divider before Total
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  // Total Due black bar
  totalDueBar: {
    backgroundColor: '#151514',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  totalDueLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  totalDueValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  // Created with text
  createdWithText: {
    fontSize: 10,
    color: '#5e6470',
    marginTop: 16,
    marginBottom: 40,
  },
  // Footer area
  footerArea: {
    flexDirection: 'row',
  },
  paymentInfo: {
    width: '50%',
  },
  qrSection: {
    width: '50%',
    alignItems: 'flex-end',
  },
  qrPlaceholder: {
    width: 160,
    height: 161,
    backgroundColor: 'rgba(21, 21, 20, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrImage: {
    width: 160,
    height: 161,
  },
  qrText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#151514',
  },
})

interface InvoicePDFProps {
  invoice: GuestInvoice
  includeQRCode?: boolean
  qrCodeDataUrl?: string
}

export default function InvoicePDF({ invoice, includeQRCode, qrCodeDataUrl }: InvoicePDFProps) {
  const discountPercent = parseFloat(String(invoice.discount)) || 0
  const discountAmount = invoice.subtotal * (discountPercent / 100)
  
  // Calculate tax rate from first item or use default
  const taxRate = invoice.items.length > 0 
    ? (parseFloat(String(invoice.items[0].vat)) || 0) 
    : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo */}
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>Customer logo</Text>
        </View>

        {/* Billed from / Billed to */}
        <View style={styles.billingRow}>
          {/* Billed from */}
          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Billed from</Text>
            <Text style={styles.sectionName}>{invoice.from_info.name || 'To Company Name'}</Text>
            <Text style={styles.sectionText}>Your name</Text>
            <Text style={styles.sectionText}>{invoice.from_info.street || 'Street'}</Text>
            <Text style={styles.sectionText}>{invoice.from_info.zip || 'ZIP/City'}</Text>
            <Text style={styles.sectionText}>email</Text>
            <Text style={styles.sectionText}>website</Text>
          </View>
          
          {/* Billed to */}
          <View style={styles.billingColumn}>
            <Text style={styles.sectionTitle}>Billed to</Text>
            <Text style={styles.sectionName}>{invoice.to_info.name || 'To Company Name'}</Text>
            <Text style={styles.sectionText}>{invoice.to_info.address || 'Address'}</Text>
            <Text style={styles.sectionText}>{invoice.to_info.zip || 'Zip/City'}</Text>
            <Text style={styles.sectionText}>Telephone</Text>
            <Text style={styles.sectionText}>Email</Text>
          </View>
        </View>

        {/* Invoice Details Row - Due date/Issued (beige) | Invoice number (white) */}
        <View style={styles.invoiceDetailsRow}>
          <View style={styles.invoiceDetailsLeft}>
            <View style={styles.dueDateColumn}>
              <Text style={styles.invoiceDetailLabel}>Due date</Text>
              <Text style={styles.invoiceDetailValue}>{formatDateInvoice(invoice.due_date)}</Text>
            </View>
            <View style={styles.issuedColumn}>
              <Text style={styles.invoiceDetailLabel}>Issued</Text>
              <Text style={styles.invoiceDetailValue}>{formatDateInvoice(invoice.issued_on)}</Text>
            </View>
          </View>
          <View style={styles.invoiceDetailsRight}>
            <Text style={styles.invoiceDetailLabel}>Invoice number</Text>
            <Text style={styles.invoiceDetailValue}>#{invoice.invoice_number || 'N/A'}</Text>
          </View>
        </View>

        {/* Table: Left column (white) + Right column (beige with summary) */}
        <View style={styles.tableContainer}>
          {/* Left Column - Item descriptions */}
          <View style={styles.tableLeftColumn}>
            {/* Header */}
            <View style={styles.tableHeaderLeft}>
              <Text style={styles.tableHeaderText}>Item description</Text>
            </View>
            
            {/* Item rows */}
            {invoice.items.map((item, index) => (
              <View key={index} style={styles.tableRowLeft}>
                <Text style={styles.tableCellText}>{item.description || 'Item Name'}</Text>
              </View>
            ))}
          </View>

          {/* Right Column - Qty, Rate, Amount + Summary */}
          <View style={styles.tableRightColumn}>
            {/* Header */}
            <View style={styles.tableHeaderRight}>
              <Text style={[styles.tableHeaderText, styles.headerQty]}>Qty</Text>
              <Text style={[styles.tableHeaderText, styles.headerRate]}>Rate</Text>
              <Text style={[styles.tableHeaderText, styles.headerAmount]}>Amount</Text>
            </View>
            
            {/* Item rows */}
            {invoice.items.map((item, index) => {
              const itemTotal = calculateItemTotalWithVAT(item)
              const qty = parseFloat(String(item.quantity)) || 0
              const um = parseFloat(String(item.um)) || 1
              const totalQty = qty * um
              const rate = parseFloat(String(item.pricePerUm)) || 0
              
              return (
                <View key={index} style={styles.tableRowRight}>
                  <Text style={[styles.tableCellText, styles.cellQty]}>{totalQty || '1'}</Text>
                  <Text style={[styles.tableCellText, styles.cellRate]}>
                    {rate ? formatSwissCurrency(rate, invoice.currency) : '-'}
                  </Text>
                  <Text style={[styles.tableCellText, styles.cellAmount]}>
                    {formatSwissCurrency(itemTotal, invoice.currency)}
                  </Text>
                </View>
              )
            })}

            {/* Summary rows */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatSwissCurrency(invoice.subtotal, invoice.currency)}
              </Text>
            </View>
            
            {taxRate > 0 && invoice.vat_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax ({taxRate}%)</Text>
                <Text style={styles.summaryValue}>
                  {formatSwissCurrency(invoice.vat_amount, invoice.currency)}
                </Text>
              </View>
            )}
            
            {discountPercent > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({discountPercent}%)</Text>
                <Text style={styles.summaryValue}>
                  -{formatSwissCurrency(discountAmount, invoice.currency)}
                </Text>
              </View>
            )}

            <View style={styles.summaryDivider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>
                {formatSwissCurrency(invoice.total, invoice.currency)}
              </Text>
            </View>

            {/* Total Due black bar */}
            <View style={styles.totalDueBar}>
              <Text style={styles.totalDueLabel}>Total Due</Text>
              <Text style={styles.totalDueValue}>
                {formatSwissCurrency(invoice.total, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Created with Fakturio.ch */}
        <Text style={styles.createdWithText}>Created with Fakturio.ch</Text>

        {/* Footer area: Payment info + QR code */}
        <View style={styles.footerArea}>
          {/* Payment Information */}
          <View style={styles.paymentInfo}>
            <Text style={styles.sectionTitle}>Payment information</Text>
            {invoice.from_info.iban && (
              <Text style={styles.sectionName}>IBAN: {invoice.from_info.iban}</Text>
            )}
            <Text style={styles.sectionText}>Payment Method: {invoice.payment_method}</Text>
            <Text style={styles.sectionText}>Reference: {invoice.invoice_number || 'N/A'}</Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            {includeQRCode && qrCodeDataUrl ? (
              <Image style={styles.qrImage} src={qrCodeDataUrl} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrText}>QR</Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
