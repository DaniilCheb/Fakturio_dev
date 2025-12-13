'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Modal, { ModalBody, ModalFooter } from '../Modal'
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

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#F5C842" />
    <path d="M9 12l2 2 4-4" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

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

  const handleContinueWithGoogle = async () => {
    // Save invoice to localStorage before redirecting so it can be migrated
    if (onSaveBeforeAuth) {
      try {
        await onSaveBeforeAuth()
        console.log('[SaveInvoiceModal] Invoice saved before Google auth redirect')
      } catch (e) {
        console.warn('[SaveInvoiceModal] Failed to save invoice before auth:', e)
      }
    }
    onClose()
    // Redirect to sign-up page which has Google OAuth option
    router.push('/sign-up')
  }

  const handleContinueWithEmail = async () => {
    // Save invoice to localStorage before redirecting so it can be migrated
    if (onSaveBeforeAuth) {
      try {
        await onSaveBeforeAuth()
        console.log('[SaveInvoiceModal] Invoice saved before email auth redirect')
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
      <ModalBody>
        <p className="text-[14px] text-[#141414] dark:text-white mb-3">
          Create a free account to access your invoices anytime.
        </p>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14px] text-[#141414] dark:text-white">
              Generate Swiss QR-bills in seconds
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14px] text-[#141414] dark:text-white">
              Track expenses and stay tax-ready
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14px] text-[#141414] dark:text-white">
              Manage clients and project budgets
            </p>
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter className="flex-col sm:flex-col gap-3">
        <Button variant="primary" className="w-full" onClick={handleContinueWithGoogle}>
          Continue with Google
        </Button>

        <Button variant="secondary" className="w-full" onClick={handleContinueWithEmail}>
          Sign up with email
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
            'Save & Download PDF'
          )}
        </Button>

        {onSaveOnly && (
          <Button
            variant="ghost"
            onClick={onSaveOnly}
            className="w-full"
            disabled={isLoading || isSaving}
          >
            Save without downloading
          </Button>
        )}
        
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

