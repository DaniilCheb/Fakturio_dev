'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from './Icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: string
}

/**
 * Base Modal component with header, body, and footer slots
 * 
 * Usage:
 * <Modal isOpen={isOpen} onClose={onClose} title="Modal Title">
 *   <ModalBody>
 *     <p>Modal content here</p>
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button onClick={onClose}>Cancel</Button>
 *     <Button variant="primary">Submit</Button>
 *   </ModalFooter>
 * </Modal>
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = '640px' }: ModalProps) {
  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div 
        className="relative bg-design-surface-default dark:bg-[#252525] border border-design-border-default rounded-2xl shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-design-border-default shrink-0">
            <h2 className="text-[18px] font-semibold text-design-content-default">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-design-content-weak hover:text-design-content-default transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        
        {/* Content - scrollable area */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )

  // Use portal to render modal at document body level
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}

/**
 * Modal body wrapper with standard padding
 */
export function ModalBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-4 sm:p-6 flex flex-col gap-4 text-left ${className}`}>
      {children}
    </div>
  )
}

/**
 * Modal footer wrapper for action buttons
 */
export function ModalFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 px-4 sm:px-6 pb-4 sm:pb-6 ${className}`}>
      {children}
    </div>
  )
}
