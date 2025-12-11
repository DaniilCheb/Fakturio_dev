/**
 * Bank Account Service
 * CRUD operations for bank accounts
 */

import { getUserItem, setUserItem, generateId } from './storage'

const STORAGE_KEY = 'bank_accounts'

/**
 * Get all bank accounts for a user
 * @param {string} userId - User ID
 * @returns {Array} List of bank accounts
 */
export function getBankAccounts(userId) {
  return getUserItem(userId, STORAGE_KEY, [])
}

/**
 * Get the default bank account for a user
 * @param {string} userId - User ID
 * @returns {Object|null} Default bank account or null
 */
export function getDefaultBankAccount(userId) {
  const accounts = getBankAccounts(userId)
  return accounts.find(a => a.isDefault) || accounts[0] || null
}

/**
 * Save a new bank account
 * @param {string} userId - User ID
 * @param {Object} accountData - Bank account data
 * @returns {Object} Created bank account with ID
 */
export function saveBankAccount(userId, accountData) {
  const accounts = getBankAccounts(userId)
  const newAccount = {
    id: generateId(),
    ...accountData,
    createdAt: new Date().toISOString()
  }
  
  // If this is the first account or marked as default, update others
  if (newAccount.isDefault || accounts.length === 0) {
    accounts.forEach(a => a.isDefault = false)
    newAccount.isDefault = true
  }
  
  accounts.push(newAccount)
  setUserItem(userId, STORAGE_KEY, accounts)
  return newAccount
}

/**
 * Update a bank account
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated account or null
 */
export function updateBankAccount(userId, accountId, updates) {
  const accounts = getBankAccounts(userId)
  const index = accounts.findIndex(a => a.id === accountId)
  if (index === -1) return null
  
  // If setting as default, unset others
  if (updates.isDefault) {
    accounts.forEach(a => a.isDefault = false)
  }
  
  accounts[index] = { ...accounts[index], ...updates }
  setUserItem(userId, STORAGE_KEY, accounts)
  return accounts[index]
}

/**
 * Delete a bank account
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID
 * @returns {boolean} Success
 */
export function deleteBankAccount(userId, accountId) {
  const accounts = getBankAccounts(userId)
  const filtered = accounts.filter(a => a.id !== accountId)
  if (filtered.length === accounts.length) return false
  
  // If deleted account was default, make first remaining account default
  if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
    filtered[0].isDefault = true
  }
  
  setUserItem(userId, STORAGE_KEY, filtered)
  return true
}

/**
 * Set a bank account as default
 * @param {string} userId - User ID
 * @param {string} accountId - Account ID to set as default
 * @returns {boolean} Success
 */
export function setDefaultBankAccount(userId, accountId) {
  const accounts = getBankAccounts(userId)
  const account = accounts.find(a => a.id === accountId)
  if (!account) return false
  
  accounts.forEach(a => a.isDefault = a.id === accountId)
  setUserItem(userId, STORAGE_KEY, accounts)
  return true
}

