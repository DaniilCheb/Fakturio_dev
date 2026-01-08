/**
 * Toast notification utility
 * Provides a consistent way to show notifications throughout the app
 * Replaces alert() calls with user-friendly toast messages
 */

import { toast as sonnerToast } from 'sonner'

/**
 * Show an error toast notification
 */
export function toastError(message: string, description?: string) {
  sonnerToast.error(message, {
    description,
    duration: 5000,
  })
}

/**
 * Show a success toast notification
 */
export function toastSuccess(message: string, description?: string) {
  sonnerToast.success(message, {
    description,
    duration: 3000,
  })
}

/**
 * Show a warning toast notification
 */
export function toastWarning(message: string, description?: string) {
  sonnerToast.warning(message, {
    description,
    duration: 4000,
  })
}

/**
 * Show an info toast notification
 */
export function toastInfo(message: string, description?: string) {
  sonnerToast.info(message, {
    description,
    duration: 3000,
  })
}

/**
 * Show a loading toast notification
 * Returns a function to update/dismiss the toast
 */
export function toastLoading(message: string) {
  return sonnerToast.loading(message)
}

/**
 * Replace alert() with toast
 * This is a drop-in replacement for alert() calls
 */
export function showAlert(message: string, type: 'error' | 'warning' | 'info' = 'error') {
  if (type === 'error') {
    toastError(message)
  } else if (type === 'warning') {
    toastWarning(message)
  } else {
    toastInfo(message)
  }
}

