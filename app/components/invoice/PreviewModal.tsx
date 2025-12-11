'use client'

import React from 'react'
import Modal, { ModalBody, ModalFooter } from '../Modal'
import Button from '../Button'
import InvoicePreview from './InvoicePreview'
import { GuestInvoice } from '@/lib/types/invoice'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: GuestInvoice
  onDownload?: () => void
}

export default function PreviewModal({ isOpen, onClose, invoice, onDownload }: PreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <ModalBody className="p-0 max-h-[90vh] overflow-y-auto">
        <InvoicePreview invoice={invoice} />
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

