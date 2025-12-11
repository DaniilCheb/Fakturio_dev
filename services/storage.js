/**
 * Generic localStorage abstraction
 * Provides a consistent API for storing and retrieving data
 */

const PREFIX = 'fakturio'

/**
 * Get an item from localStorage
 * @param {string} key - The storage key (without prefix)
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {*} Parsed JSON value or defaultValue
 */
export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(`${PREFIX}_${key}`)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error)
    return defaultValue
  }
}

/**
 * Set an item in localStorage
 * @param {string} key - The storage key (without prefix)
 * @param {*} value - Value to store (will be JSON stringified)
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(`${PREFIX}_${key}`, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error)
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - The storage key (without prefix)
 */
export function removeItem(key) {
  localStorage.removeItem(`${PREFIX}_${key}`)
}

/**
 * Get a user-scoped item
 * @param {string} userId - User ID
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value
 * @returns {*} Stored value or default
 */
export function getUserItem(userId, key, defaultValue = null) {
  return getItem(`${key}_${userId}`, defaultValue)
}

/**
 * Set a user-scoped item
 * @param {string} userId - User ID
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function setUserItem(userId, key, value) {
  setItem(`${key}_${userId}`, value)
}

/**
 * Remove a user-scoped item
 * @param {string} userId - User ID
 * @param {string} key - Storage key
 */
export function removeUserItem(userId, key) {
  removeItem(`${key}_${userId}`)
}

/**
 * Get raw string from localStorage (for logos, etc.)
 * @param {string} key - Full storage key
 * @returns {string|null} Raw string value
 */
export function getRawItem(key) {
  return localStorage.getItem(`${PREFIX}_${key}`)
}

/**
 * Set raw string in localStorage
 * @param {string} key - Full storage key
 * @param {string} value - Raw string value
 */
export function setRawItem(key, value) {
  localStorage.setItem(`${PREFIX}_${key}`, value)
}

/**
 * Remove raw item from localStorage
 * @param {string} key - Full storage key
 */
export function removeRawItem(key) {
  localStorage.removeItem(`${PREFIX}_${key}`)
}

/**
 * Generate a unique ID
 * Uses crypto.randomUUID with timestamp fallback
 * @returns {string} Unique identifier
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: timestamp + random string
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
}

