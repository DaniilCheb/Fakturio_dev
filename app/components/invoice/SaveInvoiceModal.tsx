'use client'

import React from 'react'
import Modal, { ModalBody, ModalFooter } from '../Modal'
import Button from '../Button'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

interface SaveInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onDownload: () => void
}

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#F5C842" />
    <path d="M9 12l2 2 4-4" stroke="#141414" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function SaveInvoiceModal({ isOpen, onClose, onDownload }: SaveInvoiceModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save your invoice" maxWidth="md">
      <ModalBody>
        <p className="text-[14px] text-[#141414] dark:text-white mb-6">
          Create a free account to access your invoices anytime
        </p>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14px] text-[#141414] dark:text-white">
              Generate Swiss QR-bills in seconds
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14px] text-[#141414] dark:text-white">
              Track expenses and stay tax-ready
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CheckIcon />
            </div>
            <p className="text-[14px] text-[#141414] dark:text-white">
              Manage clients and project budgets
            </p>
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter className="flex-col gap-3">
        <SignUpButton mode="modal">
          <Button variant="primary" className="w-full">
            Create free account
          </Button>
        </SignUpButton>
        
        <Button variant="secondary" onClick={onDownload} className="w-full">
          Download without account
        </Button>
        
        <div className="text-center mt-2">
          <p className="text-[13px] text-[#666666] dark:text-[#999]">
            Already have an account?{' '}
            <SignInButton mode="modal">
              <button className="text-[#141414] dark:text-white font-medium hover:underline">
                Log in
              </button>
            </SignInButton>
          </p>
        </div>
      </ModalFooter>
    </Modal>
  )
}

