'use client'

import { useState, useCallback } from 'react'
import ConfirmDialog from './ConfirmDialog'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

/**
 * Hook that provides a promise-based confirmation dialog API
 * Similar to native confirm() but with custom UI
 * 
 * Usage:
 * ```tsx
 * const { confirm, DialogComponent } = useConfirmDialog()
 * 
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     message: 'Are you sure you want to delete this?',
 *     variant: 'destructive'
 *   })
 *   if (confirmed) {
 *     // Proceed with deletion
 *   }
 * }
 * 
 * return (
 *   <div>
 *     {DialogComponent}
 *     <button onClick={handleDelete}>Delete</button>
 *   </div>
 * )
 * ```
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options,
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(true)
      setDialogState(null)
    }
  }, [dialogState])

  const handleCancel = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(false)
      setDialogState(null)
    }
  }, [dialogState])

  const DialogComponent = dialogState ? (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={dialogState.options.title}
      message={dialogState.options.message}
      confirmText={dialogState.options.confirmText}
      cancelText={dialogState.options.cancelText}
      variant={dialogState.options.variant}
    />
  ) : null

  return {
    confirm,
    DialogComponent,
  }
}

