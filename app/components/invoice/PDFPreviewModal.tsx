'use client'

import React, { useEffect } from 'react'
import Modal, { ModalBody, ModalFooter } from '../Modal'
import Button from '../Button'

interface PDFPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  pdfUrl: string | null
  isLoading?: boolean
  onDownload?: () => void
}

export default function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  isLoading = false,
  onDownload 
}: PDFPreviewModalProps) {
  // Cleanup blob URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  const handleClose = () => {
    // Revoke blob URL when closing
    if (pdfUrl && pdfUrl.startsWith('blob:')) {
      URL.revokeObjectURL(pdfUrl)
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invoice PDF Preview" maxWidth="1200px">
      <ModalBody className="p-0 max-h-[90vh] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-design-content-default mx-auto mb-4"></div>
              <p className="text-design-content-weak">Generating PDF preview...</p>
            </div>
          </div>
        ) : pdfUrl ? (
          <div className="bg-white rounded-lg overflow-hidden" style={{ height: '90vh', maxHeight: '800px' }}>
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Invoice PDF Preview"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[600px]">
            <p className="text-design-content-weak">Failed to load PDF preview</p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        {onDownload && (
          <Button variant="primary" onClick={onDownload}>
            Download PDF
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

