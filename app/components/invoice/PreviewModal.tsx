'use client'

import React, { useEffect, useState } from 'react'
import Modal, { ModalBody, ModalFooter } from '../Modal'
import Button from '../Button'
import InvoicePreview from './InvoicePreview'
import { GuestInvoice } from '@/lib/types/invoice'
import { generateInvoiceQRCode } from '@/lib/services/qrCodeService'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: GuestInvoice
  onDownload?: () => void
}

export default function PreviewModal({ isOpen, onClose, invoice, onDownload }: PreviewModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [qrCodeType, setQrCodeType] = useState<'swiss' | 'simple' | 'none'>('none')
  const [isLoadingQR, setIsLoadingQR] = useState(false)

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && invoice) {
      // Check if cached QR exists
      if (invoice.qr_code_data_url) {
        setQrCodeDataUrl(invoice.qr_code_data_url)
        setQrCodeType('swiss') // Assume cached is Swiss QR
        return
      }

      setIsLoadingQR(true)
      generateInvoiceQRCode(invoice)
        .then((result) => {
          setQrCodeDataUrl(result.dataUrl)
          setQrCodeType(result.type)
        })
        .catch((error) => {
          console.error('Error generating QR code:', error)
          setQrCodeType('none')
        })
        .finally(() => {
          setIsLoadingQR(false)
        })
    }
  }, [isOpen, invoice])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQrCodeDataUrl(null)
      setQrCodeType('none')
      setIsLoadingQR(false)
    }
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <ModalBody className="p-0 max-h-[90vh] overflow-y-auto">
        <InvoicePreview 
          invoice={invoice} 
          qrCodeDataUrl={qrCodeDataUrl}
          qrCodeType={qrCodeType}
          isLoadingQR={isLoadingQR}
        />
      </ModalBody>
      {onDownload && (
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onDownload}>
            Download PDF
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}

