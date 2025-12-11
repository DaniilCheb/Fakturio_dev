import { GuestInvoice } from '../types/invoice'
import { formatDate, formatSwissCurrency } from '../utils/formatters'
import { calculateItemTotalWithVAT } from '../utils/invoiceCalculations'

// Dynamic import for pdfmake to avoid SSR issues
let pdfMake: any = null
let pdfFonts: any = null

async function loadPdfMake() {
  if (typeof window === 'undefined') return
  
  if (!pdfMake) {
    pdfMake = (await import('pdfmake/build/pdfmake')).default
    pdfFonts = (await import('pdfmake/build/vfs_fonts')).default
    
    if (pdfMake && pdfFonts) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs
    }
  }
  
  return pdfMake
}

export async function generateInvoicePDF(invoice: GuestInvoice): Promise<void> {
  const pdfMakeInstance = await loadPdfMake()
  
  if (!pdfMakeInstance) {
    throw new Error('PDF generation is only available in the browser')
  }
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Header
      {
        columns: [
          {
            text: 'INVOICE',
            style: 'header',
            fontSize: 24,
            bold: true
          },
          {
            text: [
              { text: 'Date: ', style: 'label' },
              { text: formatDate(invoice.issued_on), style: 'value' },
              { text: '\nDue: ', style: 'label' },
              { text: formatDate(invoice.due_date), style: 'value' }
            ],
            alignment: 'right',
            fontSize: 12
          }
        ],
        marginBottom: 20
      },
      {
        text: `#${invoice.invoice_number}`,
        fontSize: 12,
        color: '#666666',
        marginBottom: 30
      },
      
      // From / To
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'From', style: 'sectionTitle', marginBottom: 8 },
              { text: invoice.from_info.name, marginBottom: 4 },
              { text: invoice.from_info.street, marginBottom: 4 },
              { text: invoice.from_info.zip, marginBottom: 4 },
              invoice.from_info.iban ? { text: `IBAN: ${invoice.from_info.iban}`, marginTop: 8 } : null
            ].filter(Boolean)
          },
          {
            width: '*',
            stack: [
              { text: 'To', style: 'sectionTitle', marginBottom: 8 },
              invoice.to_info.uid ? { text: `UID: ${invoice.to_info.uid}`, marginBottom: 4 } : null,
              { text: invoice.to_info.name, marginBottom: 4 },
              { text: invoice.to_info.address, marginBottom: 4 },
              { text: invoice.to_info.zip, marginBottom: 4 }
            ].filter(Boolean)
          }
        ],
        marginBottom: 30
      },
      
      // Description
      invoice.description ? {
        text: invoice.description,
        fontSize: 11,
        marginBottom: 20
      } : null,
      
      // Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 60, 80, 60, 80],
          body: [
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader', alignment: 'right' },
              { text: 'Price', style: 'tableHeader', alignment: 'right' },
              { text: 'VAT', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' }
            ],
            ...invoice.items.map(item => {
              const total = calculateItemTotalWithVAT(item)
              return [
                { text: item.description, fontSize: 10 },
                { text: `${item.quantity} × ${item.um}`, fontSize: 10, alignment: 'right' },
                { text: formatSwissCurrency(item.pricePerUm, invoice.currency), fontSize: 10, alignment: 'right' },
                { text: `${item.vat}%`, fontSize: 10, alignment: 'right' },
                { text: formatSwissCurrency(total, invoice.currency), fontSize: 10, alignment: 'right', bold: true }
              ]
            })
          ]
        },
        marginBottom: 20
      },
      
      // Totals
      {
        columns: [
          { text: '', width: '*' },
          {
            width: 200,
            stack: [
              {
                columns: [
                  { text: 'Subtotal', fontSize: 11, alignment: 'left' },
                  { text: formatSwissCurrency(invoice.subtotal, invoice.currency), fontSize: 11, alignment: 'right' }
                ],
                marginBottom: 4
              },
              invoice.discount && parseFloat(String(invoice.discount)) > 0 ? {
                columns: [
                  { text: `Discount (${invoice.discount}%)`, fontSize: 11, alignment: 'left' },
                  { 
                    text: `- ${formatSwissCurrency(
                      invoice.subtotal * (parseFloat(String(invoice.discount)) / 100),
                      invoice.currency
                    )}`, 
                    fontSize: 11, 
                    alignment: 'right' 
                  }
                ],
                marginBottom: 4
              } : null,
              {
                columns: [
                  { text: 'VAT', fontSize: 11, alignment: 'left' },
                  { text: formatSwissCurrency(invoice.vat_amount, invoice.currency), fontSize: 11, alignment: 'right' }
                ],
                marginBottom: 4
              },
              {
                columns: [
                  { text: 'Total (incl. VAT)', fontSize: 12, bold: true, alignment: 'left' },
                  { text: formatSwissCurrency(invoice.total, invoice.currency), fontSize: 16, bold: true, alignment: 'right' }
                ],
                marginTop: 8,
                marginBottom: 4
              }
            ].filter(Boolean)
          }
        ],
        marginBottom: 30
      },
      
      // Payment Info
      {
        text: 'Payment Information',
        style: 'sectionTitle',
        marginBottom: 8
      },
      {
        text: [
          { text: 'Payment Method: ', style: 'label' },
          { text: invoice.payment_method, style: 'value' },
          invoice.from_info.iban ? [
            { text: '\nIBAN: ', style: 'label' },
            { text: invoice.from_info.iban, style: 'value' }
          ] : [],
          { text: '\nReference: ', style: 'label' },
          { text: invoice.invoice_number, style: 'value' }
        ],
        fontSize: 11,
        marginBottom: 20
      }
    ],
    styles: {
      header: {
        fontSize: 24,
        bold: true
      },
      sectionTitle: {
        fontSize: 12,
        bold: true,
        color: '#474743'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#474743'
      },
      label: {
        fontSize: 11,
        color: '#666666'
      },
      value: {
        fontSize: 11,
        color: '#141414'
      }
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 11
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfMakeInstance.createPdf(docDefinition as any)
      pdfDoc.download(`invoice-${invoice.invoice_number}.pdf`)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

