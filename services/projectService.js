/**
 * Project Service
 * CRUD operations for projects
 */

import { getUserItem, setUserItem, generateId } from './storage'

const STORAGE_KEY = 'projects'

/**
 * Get all projects for a user
 * @param {string} userId - User ID
 * @returns {Array} List of projects
 */
export function getProjects(userId) {
  return getUserItem(userId, STORAGE_KEY, [])
}

/**
 * Get a single project by ID
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {Object|null} Project or null if not found
 */
export function getProjectById(userId, projectId) {
  const projects = getProjects(userId)
  return projects.find(p => p.id === projectId) || null
}

/**
 * Get projects by customer ID
 * @param {string} userId - User ID
 * @param {string} customerId - Customer ID
 * @returns {Array} List of projects for customer
 */
export function getProjectsByCustomer(userId, customerId) {
  const projects = getProjects(userId)
  return projects.filter(p => p.customerId === customerId)
}

/**
 * Save a new project
 * @param {string} userId - User ID
 * @param {Object} projectData - Project data
 * @returns {Object} Created project with ID
 */
export function saveProject(userId, projectData) {
  const projects = getProjects(userId)
  const newProject = {
    id: generateId(),
    ...projectData,
    createdAt: new Date().toISOString()
  }
  projects.unshift(newProject)
  setUserItem(userId, STORAGE_KEY, projects)
  return newProject
}

/**
 * Update an existing project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated project or null
 */
export function updateProject(userId, projectId, updates) {
  const projects = getProjects(userId)
  const index = projects.findIndex(p => p.id === projectId)
  if (index === -1) return null
  
  projects[index] = { ...projects[index], ...updates }
  setUserItem(userId, STORAGE_KEY, projects)
  return projects[index]
}

/**
 * Delete a project
 * @param {string} userId - User ID
 * @param {string} projectId - Project ID
 * @returns {boolean} Success
 */
export function deleteProject(userId, projectId) {
  const projects = getProjects(userId)
  const filtered = projects.filter(p => p.id !== projectId)
  if (filtered.length === projects.length) return false
  
  setUserItem(userId, STORAGE_KEY, filtered)
  return true
}

