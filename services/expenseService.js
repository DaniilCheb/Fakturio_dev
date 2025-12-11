/**
 * Expense Service
 * CRUD operations for expenses
 */

import { getUserItem, setUserItem, generateId } from './storage'

const STORAGE_KEY = 'expenses'

/**
 * Get all expenses for a user
 * @param {string} userId - User ID
 * @returns {Array} List of expenses
 */
export function getExpenses(userId) {
  return getUserItem(userId, STORAGE_KEY, [])
}

/**
 * Get a single expense by ID
 * @param {string} userId - User ID
 * @param {string} expenseId - Expense ID
 * @returns {Object|null} Expense or null if not found
 */
export function getExpenseById(userId, expenseId) {
  const expenses = getExpenses(userId)
  return expenses.find(e => e.id === expenseId) || null
}

/**
 * Save a new expense
 * @param {string} userId - User ID
 * @param {Object} expenseData - Expense data
 * @returns {Object} Created expense with ID
 */
export function saveExpense(userId, expenseData) {
  const expenses = getExpenses(userId)
  const newExpense = {
    id: generateId(),
    ...expenseData,
    createdAt: new Date().toISOString()
  }
  expenses.unshift(newExpense)
  setUserItem(userId, STORAGE_KEY, expenses)
  return newExpense
}

/**
 * Update an existing expense
 * @param {string} userId - User ID
 * @param {string} expenseId - Expense ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated expense or null
 */
export function updateExpense(userId, expenseId, updates) {
  const expenses = getExpenses(userId)
  const index = expenses.findIndex(e => e.id === expenseId)
  if (index === -1) return null
  
  expenses[index] = { ...expenses[index], ...updates }
  setUserItem(userId, STORAGE_KEY, expenses)
  return expenses[index]
}

/**
 * Delete an expense
 * @param {string} userId - User ID
 * @param {string} expenseId - Expense ID
 * @returns {boolean} Success
 */
export function deleteExpense(userId, expenseId) {
  const expenses = getExpenses(userId)
  const filtered = expenses.filter(e => e.id !== expenseId)
  if (filtered.length === expenses.length) return false
  
  setUserItem(userId, STORAGE_KEY, filtered)
  return true
}

/**
 * Duplicate an expense
 * @param {string} userId - User ID
 * @param {string} expenseId - Expense ID to duplicate
 * @returns {Object|null} New expense or null
 */
export function duplicateExpense(userId, expenseId) {
  const expense = getExpenseById(userId, expenseId)
  if (!expense) return null
  
  const newExpense = {
    ...expense,
    id: generateId(),
    name: `${expense.name} (copy)`,
    createdAt: new Date().toISOString()
  }
  
  const expenses = getExpenses(userId)
  expenses.unshift(newExpense)
  setUserItem(userId, STORAGE_KEY, expenses)
  return newExpense
}

