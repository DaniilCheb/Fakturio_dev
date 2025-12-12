'use client'

import { useState, useCallback, useEffect } from 'react'
import { GuestInvoice, FromInfo, ToInfo, InvoiceItem } from '../types/invoice'
import {
  getAllGuestInvoices,
  saveGuestInvoice,
  updateGuestInvoice,
  getGuestInvoiceById,
  deleteGuestInvoice
} from '../services/guestInvoiceService'
import { generateInvoiceQRCode } from '../services/qrCodeService'

export interface UseInvoiceStorageOptions {
  /**
   * Whether the user is authenticated (for future Supabase integration)
   */
  isAuthenticated?: boolean
  /**
   * User ID for authenticated users
   */
  userId?: string
}

export interface InvoiceStorageResult {
  /**
   * All invoices for the current user/guest
   */
  invoices: GuestInvoice[]
  /**
   * Loading state
   */
  isLoading: boolean
  /**
   * Error message if any
   */
  error: string | null
  /**
   * Save a new invoice
   */
  saveInvoice: (invoice: Omit<GuestInvoice, 'id' | 'created_at' | 'updated_at'>) => Promise<GuestInvoice>
  /**
   * Update an existing invoice
   */
  updateInvoice: (id: string, updates: Partial<GuestInvoice>) => Promise<GuestInvoice | null>
  /**
   * Get invoice by ID
   */
  getInvoice: (id: string) => GuestInvoice | null
  /**
   * Delete an invoice
   */
  deleteInvoice: (id: string) => Promise<boolean>
  /**
   * Refresh invoices from storage
   */
  refresh: () => void
  /**
   * Generate and cache QR code for invoice
   */
  generateQRCode: (invoice: GuestInvoice) => Promise<{
    dataUrl: string | null
    type: 'swiss' | 'simple' | 'none'
  }>
}

/**
 * Hook for unified invoice storage
 * Handles both guest (localStorage) and authenticated (Supabase) storage
 */
export function useInvoiceStorage(
  options: UseInvoiceStorageOptions = {}
): InvoiceStorageResult {
  const { isAuthenticated = false, userId } = options
  const [invoices, setInvoices] = useState<GuestInvoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load invoices on mount and when auth state changes
  const loadInvoices = useCallback(() => {
    setIsLoading(true)
    setError(null)

    try {
      if (isAuthenticated && userId) {
        // TODO: Load from Supabase for authenticated users
        // For now, fall back to localStorage
        const stored = getAllGuestInvoices()
        setInvoices(stored)
      } else {
        // Load from localStorage for guests
        const stored = getAllGuestInvoices()
        setInvoices(stored)
      }
    } catch (err) {
      console.error('Error loading invoices:', err)
      setError('Failed to load invoices')
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, userId])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  // Save invoice
  const saveInvoice = useCallback(
    async (
      invoiceData: Omit<GuestInvoice, 'id' | 'created_at' | 'updated_at'>
    ): Promise<GuestInvoice> => {
      setError(null)

      try {
        if (isAuthenticated && userId) {
          // TODO: Save to Supabase for authenticated users
          // For now, fall back to localStorage
          const saved = saveGuestInvoice(invoiceData)
          setInvoices((prev) => [saved, ...prev])
          return saved
        } else {
          // Save to localStorage for guests
          const saved = saveGuestInvoice(invoiceData)
          setInvoices((prev) => [saved, ...prev])
          return saved
        }
      } catch (err) {
        console.error('Error saving invoice:', err)
        setError('Failed to save invoice')
        throw err
      }
    },
    [isAuthenticated, userId]
  )

  // Update invoice
  const updateInvoice = useCallback(
    async (
      id: string,
      updates: Partial<GuestInvoice>
    ): Promise<GuestInvoice | null> => {
      setError(null)

      try {
        if (isAuthenticated && userId) {
          // TODO: Update in Supabase for authenticated users
          // For now, fall back to localStorage
          const updated = updateGuestInvoice(id, updates)
          if (updated) {
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === id ? updated : inv))
            )
          }
          return updated
        } else {
          // Update in localStorage for guests
          const updated = updateGuestInvoice(id, updates)
          if (updated) {
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === id ? updated : inv))
            )
          }
          return updated
        }
      } catch (err) {
        console.error('Error updating invoice:', err)
        setError('Failed to update invoice')
        throw err
      }
    },
    [isAuthenticated, userId]
  )

  // Get invoice by ID
  const getInvoice = useCallback(
    (id: string): GuestInvoice | null => {
      // First check in-memory cache
      const cached = invoices.find((inv) => inv.id === id)
      if (cached) return cached

      // Fall back to storage
      return getGuestInvoiceById(id)
    },
    [invoices]
  )

  // Delete invoice
  const deleteInvoice = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)

      try {
        if (isAuthenticated && userId) {
          // TODO: Delete from Supabase for authenticated users
          // For now, fall back to localStorage
          const deleted = deleteGuestInvoice(id)
          if (deleted) {
            setInvoices((prev) => prev.filter((inv) => inv.id !== id))
          }
          return deleted
        } else {
          // Delete from localStorage for guests
          const deleted = deleteGuestInvoice(id)
          if (deleted) {
            setInvoices((prev) => prev.filter((inv) => inv.id !== id))
          }
          return deleted
        }
      } catch (err) {
        console.error('Error deleting invoice:', err)
        setError('Failed to delete invoice')
        throw err
      }
    },
    [isAuthenticated, userId]
  )

  // Generate and optionally cache QR code
  const generateQRCode = useCallback(
    async (
      invoice: GuestInvoice
    ): Promise<{
      dataUrl: string | null
      type: 'swiss' | 'simple' | 'none'
    }> => {
      // Return cached QR if available
      if (invoice.qr_code_data_url) {
        return { dataUrl: invoice.qr_code_data_url, type: 'swiss' }
      }

      // Generate new QR code
      const result = await generateInvoiceQRCode(invoice)

      // Cache the QR code if successful
      if (result.dataUrl && invoice.id) {
        try {
          await updateInvoice(invoice.id, { qr_code_data_url: result.dataUrl })
        } catch {
          // Caching failed, but QR generation succeeded
          console.warn('Failed to cache QR code')
        }
      }

      return result
    },
    [updateInvoice]
  )

  return {
    invoices,
    isLoading,
    error,
    saveInvoice,
    updateInvoice,
    getInvoice,
    deleteInvoice,
    refresh: loadInvoices,
    generateQRCode
  }
}

export default useInvoiceStorage

