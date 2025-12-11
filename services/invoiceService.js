/**
 * Invoice Service
 * CRUD operations for invoices
 */

import { getUserItem, setUserItem, generateId } from './storage'

const STORAGE_KEY = 'invoices'

/**
 * Get all invoices for a user
 * @param {string} userId - User ID
 * @returns {Array} List of invoices
 */
export function getInvoices(userId) {
  return getUserItem(userId, STORAGE_KEY, [])
}

/**
 * Get a single invoice by ID
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Object|null} Invoice or null if not found
 */
export function getInvoiceById(userId, invoiceId) {
  const invoices = getInvoices(userId)
  return invoices.find(inv => inv.id === invoiceId) || null
}

/**
 * Generate next invoice number in format YYYY-NN
 * @param {string} userId - User ID
 * @returns {string} Next invoice number
 */
export function getNextInvoiceNumber(userId) {
  const invoices = getInvoices(userId)
  const currentYear = new Date().getFullYear()
  
  // Find all invoice numbers for the current year
  const yearInvoices = invoices
    .map(inv => inv.invoiceData?.invoiceNumber || '')
    .filter(num => num.startsWith(`${currentYear}-`))
  
  // Extract the sequence numbers
  const sequenceNumbers = yearInvoices
    .map(num => {
      const parts = num.split('-')
      return parts.length >= 2 ? parseInt(parts[1], 10) : 0
    })
    .filter(n => !isNaN(n))
  
  // Find the highest number
  const maxSequence = sequenceNumbers.length > 0 ? Math.max(...sequenceNumbers) : 0
  
  // Generate next number with zero padding
  const nextSequence = maxSequence + 1
  const paddedSequence = nextSequence.toString().padStart(2, '0')
  
  return `${currentYear}-${paddedSequence}`
}

/**
 * Save a new invoice
 * @param {string} userId - User ID
 * @param {Object} invoiceData - Invoice data
 * @returns {Object} Created invoice with ID
 */
export function saveInvoice(userId, invoiceData) {
  const invoices = getInvoices(userId)
  const newInvoice = {
    id: generateId(),
    ...invoiceData,
    status: 'issued',
    createdAt: new Date().toISOString()
  }
  invoices.unshift(newInvoice)
  setUserItem(userId, STORAGE_KEY, invoices)
  return newInvoice
}

/**
 * Update an existing invoice
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated invoice or null
 */
export function updateInvoice(userId, invoiceId, updates) {
  const invoices = getInvoices(userId)
  const index = invoices.findIndex(inv => inv.id === invoiceId)
  if (index === -1) return null
  
  invoices[index] = { ...invoices[index], ...updates }
  setUserItem(userId, STORAGE_KEY, invoices)
  return invoices[index]
}

/**
 * Update invoice status
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID
 * @param {string} status - New status
 * @param {string} [paidDate] - Date paid (for 'paid' status)
 * @returns {Object|null} Updated invoice or null
 */
export function updateInvoiceStatus(userId, invoiceId, status, paidDate) {
  const updates = { status }
  if (status === 'paid' && paidDate) {
    updates.paidDate = paidDate
  }
  return updateInvoice(userId, invoiceId, updates)
}

/**
 * Delete an invoice
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID
 * @returns {boolean} Success
 */
export function deleteInvoice(userId, invoiceId) {
  const invoices = getInvoices(userId)
  const filtered = invoices.filter(inv => inv.id !== invoiceId)
  if (filtered.length === invoices.length) return false
  
  setUserItem(userId, STORAGE_KEY, filtered)
  return true
}

/**
 * Duplicate an invoice
 * @param {string} userId - User ID
 * @param {string} invoiceId - Invoice ID to duplicate
 * @returns {Object|null} New invoice or null
 */
export function duplicateInvoice(userId, invoiceId) {
  const invoice = getInvoiceById(userId, invoiceId)
  if (!invoice) return null
  
  const newInvoice = {
    ...invoice,
    id: generateId(),
    invoiceData: {
      ...invoice.invoiceData,
      invoiceNumber: getNextInvoiceNumber(userId),
      issuedOn: new Date().toISOString().split('T')[0]
    },
    status: 'issued',
    createdAt: new Date().toISOString(),
    paidDate: null
  }
  
  const invoices = getInvoices(userId)
  invoices.unshift(newInvoice)
  setUserItem(userId, STORAGE_KEY, invoices)
  return newInvoice
}

/**
 * Get invoice status based on dates and payment
 * @param {Object} invoice - Invoice object
 * @returns {string} Status: 'paid', 'overdue', or 'pending'
 */
export function getInvoiceStatus(invoice) {
  if (invoice.status === 'paid') return 'paid'
  
  const dueDate = invoice.dueDate || invoice.invoiceData?.dueDate
  if (dueDate) {
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (due < today) return 'overdue'
  }
  
  return 'pending'
}

