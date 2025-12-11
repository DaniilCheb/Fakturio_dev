/**
 * Contact Service
 * CRUD operations for contacts/customers
 */

import { getUserItem, setUserItem, generateId } from './storage'

const STORAGE_KEY = 'contacts'

/**
 * Get all contacts for a user
 * @param {string} userId - User ID
 * @returns {Array} List of contacts
 */
export function getContacts(userId) {
  return getUserItem(userId, STORAGE_KEY, [])
}

/**
 * Get a single contact by ID
 * @param {string} userId - User ID
 * @param {string} contactId - Contact ID
 * @returns {Object|null} Contact or null if not found
 */
export function getContactById(userId, contactId) {
  const contacts = getContacts(userId)
  return contacts.find(c => c.id === contactId) || null
}

/**
 * Save a new contact
 * @param {string} userId - User ID
 * @param {Object} contactData - Contact data
 * @returns {Object} Created contact with ID
 */
export function saveContact(userId, contactData) {
  const contacts = getContacts(userId)
  const newContact = {
    id: generateId(),
    ...contactData,
    createdAt: new Date().toISOString()
  }
  contacts.unshift(newContact)
  setUserItem(userId, STORAGE_KEY, contacts)
  return newContact
}

/**
 * Update an existing contact
 * @param {string} userId - User ID
 * @param {string} contactId - Contact ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated contact or null
 */
export function updateContact(userId, contactId, updates) {
  const contacts = getContacts(userId)
  const index = contacts.findIndex(c => c.id === contactId)
  if (index === -1) return null
  
  contacts[index] = { ...contacts[index], ...updates }
  setUserItem(userId, STORAGE_KEY, contacts)
  return contacts[index]
}

/**
 * Delete a contact
 * @param {string} userId - User ID
 * @param {string} contactId - Contact ID
 * @returns {boolean} Success
 */
export function deleteContact(userId, contactId) {
  const contacts = getContacts(userId)
  const filtered = contacts.filter(c => c.id !== contactId)
  if (filtered.length === contacts.length) return false
  
  setUserItem(userId, STORAGE_KEY, filtered)
  return true
}

