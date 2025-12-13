'use client'

import React from 'react'
import Modal, { ModalBody, ModalFooter } from './Modal'
import Button from './Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isLoading?: boolean
}

/**
 * Custom confirmation dialog component to replace native confirm() dialogs
 * 
 * Usage:
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false)
 * 
 * <ConfirmDialog
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={() => {
 *     // Handle confirmation
 *     setShowConfirm(false)
 *   }}
 *   message="Are you sure you want to delete this item?"
 *   variant="destructive"
 * />
 * ```
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <ModalBody>
        <p className="text-[14px] text-design-content-default text-left">
          {message}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1 sm:flex-none"
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

