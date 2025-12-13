'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Modal, { ModalFooter } from '../Modal'
import Button from '../Button'

interface SaveInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
  onSaveOnly?: () => void
  onSaveBeforeAuth?: () => Promise<void> // Save invoice before redirecting to auth
  isLoading?: boolean
  isSaving?: boolean
}


const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

export default function SaveInvoiceModal({ 
  isOpen, 
  onClose, 
  onDownload,
  onSaveOnly,
  onSaveBeforeAuth,
  isLoading = false,
  isSaving = false,
}: SaveInvoiceModalProps) {
  const router = useRouter()

  const handleCreateAccount = async () => {
    // Save invoice to localStorage before redirecting so it can be migrated
    if (onSaveBeforeAuth) {
      try {
        await onSaveBeforeAuth()
        console.log('[SaveInvoiceModal] Invoice saved before signup redirect')
      } catch (e) {
        console.warn('[SaveInvoiceModal] Failed to save invoice before auth:', e)
      }
    }
    onClose()
    router.push('/sign-up')
  }

  const handleLogin = async () => {
    // Save invoice to localStorage before redirecting so it can be migrated
    if (onSaveBeforeAuth) {
      try {
        await onSaveBeforeAuth()
        console.log('[SaveInvoiceModal] Invoice saved before login redirect')
      } catch (e) {
        console.warn('[SaveInvoiceModal] Failed to save invoice before auth:', e)
      }
    }
    onClose()
    router.push('/sign-in')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keep your invoices in one place" maxWidth="md">
      <ModalFooter className="flex-col sm:flex-col gap-3">
        <Button variant="primary" className="w-full" onClick={handleCreateAccount}>
          Create free account
        </Button>
        
        <Button 
          variant="secondary" 
          onClick={onDownload} 
          className="w-full"
          disabled={isLoading || isSaving}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Generating PDF...
            </span>
          ) : isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Saving...
            </span>
          ) : (
            'Download PDF'
          )}
        </Button>
        
        <div className="text-center mt-2">
          <p className="text-[13px] text-[#666666] dark:text-[#999]">
            Already have an account?{' '}
            <button
              className="text-[#141414] dark:text-white font-medium hover:underline"
              onClick={handleLogin}
              type="button"
            >
              Log in
            </button>
          </p>
        </div>
      </ModalFooter>
    </Modal>
  )
}

