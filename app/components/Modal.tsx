'use client'

import React from 'react'
import { CloseIcon } from './Icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | string
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
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  }

  // Check if maxWidth is a predefined size or a custom value
  const maxWidthClass = maxWidthClasses[maxWidth as keyof typeof maxWidthClasses] 
    ? maxWidthClasses[maxWidth as keyof typeof maxWidthClasses]
    : undefined
  
  const customMaxWidth = maxWidthClass 
    ? undefined 
    : typeof maxWidth === 'string' && maxWidth.includes('px') 
      ? { maxWidth } 
      : { maxWidth: `${maxWidth}px` }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className={`relative bg-white dark:bg-[#252525] rounded-2xl shadow-xl w-full ${maxWidthClass || ''} overflow-hidden`}
        style={customMaxWidth}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#e0e0e0] dark:border-[#333]">
            <h2 className="text-[18px] font-semibold text-[#141414] dark:text-white">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-[#666] dark:text-[#999] hover:text-[#141414] dark:hover:text-white transition-colors"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        
        {/* Content */}
        {children}
      </div>
    </div>
  )
}

/**
 * Modal body wrapper with standard padding
 */
export function ModalBody({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`p-4 sm:p-5 flex flex-col gap-4 ${className}`}>
      {children}
    </div>
  )
}

/**
 * Modal footer wrapper for action buttons
 */
export function ModalFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`flex flex-col sm:flex-row gap-3 px-4 sm:px-5 pb-4 sm:pb-5 ${className}`}>
      {children}
    </div>
  )
}

