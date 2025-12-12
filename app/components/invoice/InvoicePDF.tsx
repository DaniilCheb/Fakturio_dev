'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { GuestInvoice } from '@/lib/types/invoice'
import { formatDate } from '@/lib/utils/dateUtils'
import { formatSwissCurrency, formatSwissNumber } from '@/lib/utils/formatters'
import { calculateItemTotal, calculateItemTotalWithVAT } from '@/lib/utils/invoiceCalculations'

// Using built-in Helvetica font (no external loading needed)
// react-pdf has built-in support for: Courier, Helvetica, Times-Roman

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#141414',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  sectionContent: {
    fontSize: 11,
    color: '#141414',
    lineHeight: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '48%',
  },
  table: {
    marginTop: 30,
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    fontSize: 10,
    color: '#141414',
  },
  colQty: { width: '10%' },
  colUm: { width: '10%' },
  colDesc: { width: '45%' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
    width: 100,
  },
  totalValue: {
    fontSize: 10,
    color: '#141414',
    width: 100,
    textAlign: 'right',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: '#141414',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#141414',
    width: 100,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#141414',
    width: 100,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#999',
  },
  paymentInfo: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f5f5f3',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#141414',
    marginBottom: 8,
  },
  paymentText: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.5,
  },
  qrSection: {
    marginTop: 30,
    alignItems: 'center',
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  qrText: {
    fontSize: 8,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number || 'N/A'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.sectionContent}>Date: {formatDate(invoice.issued_on)}</Text>
            <Text style={styles.sectionContent}>Due: {formatDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* From / To */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.sectionContent}>{invoice.from_info.name || '-'}</Text>
            <Text style={styles.sectionContent}>{invoice.from_info.street || '-'}</Text>
            <Text style={styles.sectionContent}>{invoice.from_info.zip || '-'}</Text>
            {invoice.from_info.iban && (
              <Text style={[styles.sectionContent, { marginTop: 8 }]}>
                IBAN: {invoice.from_info.iban}
              </Text>
            )}
          </View>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>To</Text>
            {invoice.to_info.uid && (
              <Text style={styles.sectionContent}>UID: {invoice.to_info.uid}</Text>
            )}
            <Text style={styles.sectionContent}>{invoice.to_info.name || '-'}</Text>
            <Text style={styles.sectionContent}>{invoice.to_info.address || '-'}</Text>
            <Text style={styles.sectionContent}>{invoice.to_info.zip || '-'}</Text>
          </View>
        </View>

        {/* Description */}
        {invoice.description && (
          <View style={styles.section}>
            <Text style={styles.sectionContent}>{invoice.description}</Text>
          </View>
        )}

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUm]}>UM</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Price/UM</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map((item, index) => {
            const itemTotal = calculateItemTotalWithVAT(item)
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colQty]}>
                  {item.quantity || '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colUm]}>
                  {item.um || '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colDesc]}>
                  {item.description || '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {item.pricePerUm
                    ? formatSwissNumber(parseFloat(String(item.pricePerUm)))
                    : '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatSwissCurrency(itemTotal, invoice.currency)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatSwissCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>
          {discountPercent > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount ({discountPercent}%)</Text>
              <Text style={styles.totalValue}>
                -{formatSwissCurrency(discountAmount, invoice.currency)}
              </Text>
            </View>
          )}
          {invoice.vat_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT</Text>
              <Text style={styles.totalValue}>
                {formatSwissCurrency(invoice.vat_amount, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatSwissCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>Payment Information</Text>
          <Text style={styles.paymentText}>
            Payment Method: {invoice.payment_method}
          </Text>
          {invoice.from_info.iban && (
            <Text style={styles.paymentText}>IBAN: {invoice.from_info.iban}</Text>
          )}
          <Text style={styles.paymentText}>
            Reference: {invoice.invoice_number || 'N/A'}
          </Text>
        </View>

        {/* Swiss QR Code */}
        {includeQRCode && qrCodeDataUrl && (
          <View style={styles.qrSection}>
            <Image style={styles.qrImage} src={qrCodeDataUrl} />
            <Text style={styles.qrText}>Swiss QR-bill payment code</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by Fakturio</Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>
    </Document>
  )
}




