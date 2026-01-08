/**
 * Guest Cache Service
 * Retrieves and parses guest invoice data from localStorage for onboarding pre-fill
 */

import { GuestInvoice } from '../types/invoice'
import { getAllGuestInvoices } from './guestInvoiceService'

export interface GuestProfileData {
  name: string | null
  country: string | null
  currency: string | null
  company: string | null
  company_uid: string | null
  street: string | null
  postal_code: string | null
  city: string | null
}

export interface GuestBankData {
  account_name: string | null
  iban: string | null
}

export interface GuestCacheData {
  profile: GuestProfileData | null
  bank: GuestBankData | null
  hasData: boolean
  source_invoice_id: string | null
  last_updated: string | null
}

const CACHE_TTL_DAYS = 30
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000

/**
 * Check if cache data is expired
 */
function isCacheExpired(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true
  
  try {
    const lastUpdatedDate = new Date(lastUpdated)
    const now = new Date()
    const age = now.getTime() - lastUpdatedDate.getTime()
    return age > CACHE_TTL_MS
  } catch {
    return true
  }
}

/**
 * Extract profile data from guest invoice from_info
 */
function extractProfileFromInvoice(invoice: GuestInvoice): GuestProfileData {
  const fromInfo = invoice.from_info
  
  // Parse zip and city from combined zip field
  // Format is typically "8000 Zürich" or "8000" or "Zürich"
  let postal_code: string | null = null
  let city: string | null = null
  
  if (fromInfo.zip) {
    const zipParts = fromInfo.zip.trim().split(/\s+/)
    if (zipParts.length >= 2) {
      // Has both zip and city: "8000 Zürich"
      postal_code = zipParts[0]
      city = zipParts.slice(1).join(' ')
    } else if (/^\d+$/.test(zipParts[0])) {
      // Just zip code: "8000"
      postal_code = zipParts[0]
    } else {
      // Just city: "Zürich"
      city = zipParts[0]
    }
  }
  
  return {
    name: fromInfo.name || null,
    country: 'Switzerland', // Default to Switzerland for now
    currency: invoice.currency || null,
    company: fromInfo.company_name || null,
    company_uid: fromInfo.uid || null,
    street: fromInfo.street || null,
    postal_code,
    city,
  }
}

/**
 * Extract bank data from guest invoice from_info
 */
function extractBankFromInvoice(invoice: GuestInvoice): GuestBankData | null {
  const iban = invoice.from_info?.iban
  
  if (!iban) return null
  
  return {
    account_name: 'Main Account', // Default name
    iban: iban.trim() || null,
  }
}

/**
 * Get guest cache data from localStorage
 * Returns most recent invoice data if available and not expired
 */
export function getGuestCacheData(): GuestCacheData {
  try {
    const invoices = getAllGuestInvoices()
    
    if (invoices.length === 0) {
      return {
        profile: null,
        bank: null,
        hasData: false,
        source_invoice_id: null,
        last_updated: null,
      }
    }
    
    // Get most recent invoice (by created_at or updated_at)
    const mostRecent = invoices.reduce((latest, current) => {
      const latestTime = new Date(latest.updated_at || latest.created_at).getTime()
      const currentTime = new Date(current.updated_at || current.created_at).getTime()
      return currentTime > latestTime ? current : latest
    })
    
    // Check if cache is expired
    const lastUpdated = mostRecent.updated_at || mostRecent.created_at
    if (isCacheExpired(lastUpdated)) {
      // Cache expired - clear it
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('fakturio_guest_invoices')
        } catch {
          // Ignore errors
        }
      }
      
      return {
        profile: null,
        bank: null,
        hasData: false,
        source_invoice_id: null,
        last_updated: null,
      }
    }
    
    // Extract data from most recent invoice
    const profile = extractProfileFromInvoice(mostRecent)
    const bank = extractBankFromInvoice(mostRecent)
    
    return {
      profile: Object.values(profile).some(v => v !== null) ? profile : null,
      bank,
      hasData: true,
      source_invoice_id: mostRecent.id,
      last_updated: lastUpdated,
    }
  } catch (error) {
    console.error('Error reading guest cache:', error)
    return {
      profile: null,
      bank: null,
      hasData: false,
      source_invoice_id: null,
      last_updated: null,
    }
  }
}




