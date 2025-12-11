/**
 * Settings Service
 * User settings, VAT, logo, preferences
 */

import { getUserItem, setUserItem, getRawItem, setRawItem, removeRawItem } from './storage'

// ============ User Profile ============

const PROFILE_KEY = 'profile'

/**
 * Get user profile
 * @param {string} userId - User ID
 * @returns {Object|null} User profile
 */
export function getUserProfile(userId) {
  return getUserItem(userId, PROFILE_KEY, null)
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Object} Updated profile
 */
export function updateUserProfile(userId, updates) {
  const profile = getUserProfile(userId) || {}
  const updated = { ...profile, ...updates }
  setUserItem(userId, PROFILE_KEY, updated)
  return updated
}

// ============ Logo ============

/**
 * Save user logo (base64 data URL)
 * @param {string} userId - User ID
 * @param {string} base64Data - Logo as data URL
 */
export function saveLogo(userId, base64Data) {
  setRawItem(`logo_${userId}`, base64Data)
}

/**
 * Get user logo
 * @param {string} userId - User ID
 * @returns {string|null} Logo as data URL or null
 */
export function getLogo(userId) {
  return getRawItem(`logo_${userId}`)
}

/**
 * Delete user logo
 * @param {string} userId - User ID
 */
export function deleteLogo(userId) {
  removeRawItem(`logo_${userId}`)
}

// ============ VAT Settings ============

const VAT_KEY = 'vat_settings'

/**
 * Get VAT settings
 * @param {string} userId - User ID
 * @returns {Object} VAT settings with defaults
 */
export function getVatSettings(userId) {
  return getUserItem(userId, VAT_KEY, {
    mode: 'additive',
    vatNumber: '',
    defaultRate: 8.1
  })
}

/**
 * Update VAT settings
 * @param {string} userId - User ID
 * @param {Object} updates - VAT settings updates
 * @returns {Object} Updated settings
 */
export function updateVatSettings(userId, updates) {
  const settings = getVatSettings(userId)
  const updated = { ...settings, ...updates }
  setUserItem(userId, VAT_KEY, updated)
  return updated
}

// ============ Canton ============

const CANTON_KEY = 'canton'

/**
 * Get selected canton
 * @param {string} userId - User ID
 * @returns {string|null} Canton code or null
 */
export function getCanton(userId) {
  return getUserItem(userId, CANTON_KEY, null)
}

/**
 * Save selected canton
 * @param {string} userId - User ID
 * @param {string} cantonCode - Canton code
 */
export function saveCanton(userId, cantonCode) {
  setUserItem(userId, CANTON_KEY, cantonCode)
}

// ============ Account Currency ============

const CURRENCY_KEY = 'account_currency'

/**
 * Get account currency
 * @param {string} userId - User ID
 * @returns {string} Currency code (default: CHF)
 */
export function getAccountCurrency(userId) {
  return getUserItem(userId, CURRENCY_KEY, 'CHF')
}

/**
 * Save account currency
 * @param {string} userId - User ID
 * @param {string} currency - Currency code
 */
export function saveAccountCurrency(userId, currency) {
  setUserItem(userId, CURRENCY_KEY, currency)
}

// ============ Description Suggestions ============

const DESCRIPTIONS_KEY = 'description_suggestions'

/**
 * Get description suggestions
 * @param {string} userId - User ID
 * @returns {Array} List of suggestions
 */
export function getDescriptionSuggestions(userId) {
  return getUserItem(userId, DESCRIPTIONS_KEY, [])
}

/**
 * Save a description suggestion
 * @param {string} userId - User ID
 * @param {string} description - Description to save
 */
export function saveDescriptionSuggestion(userId, description) {
  if (!description || description.trim().length < 3) return
  
  const suggestions = getDescriptionSuggestions(userId)
  const trimmed = description.trim()
  
  // Don't add duplicates
  if (suggestions.includes(trimmed)) return
  
  // Keep last 50 suggestions
  suggestions.unshift(trimmed)
  if (suggestions.length > 50) suggestions.pop()
  
  setUserItem(userId, DESCRIPTIONS_KEY, suggestions)
}

