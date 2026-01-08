/**
 * Country-Currency Mapping Utility
 * Provides default currency for countries and auto-selection logic
 */

// ISO 3166-1 alpha-2 country codes mapped to ISO 4217 currency codes
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Switzerland & Liechtenstein
  CH: 'CHF',
  LI: 'CHF',
  
  // Eurozone countries
  AT: 'EUR', // Austria
  BE: 'EUR', // Belgium
  CY: 'EUR', // Cyprus
  DE: 'EUR', // Germany
  EE: 'EUR', // Estonia
  ES: 'EUR', // Spain
  FI: 'EUR', // Finland
  FR: 'EUR', // France
  GR: 'EUR', // Greece
  IE: 'EUR', // Ireland
  IT: 'EUR', // Italy
  LT: 'EUR', // Lithuania
  LU: 'EUR', // Luxembourg
  LV: 'EUR', // Latvia
  MT: 'EUR', // Malta
  NL: 'EUR', // Netherlands
  PT: 'EUR', // Portugal
  SI: 'EUR', // Slovenia
  SK: 'EUR', // Slovakia
  
  // Other European countries
  GB: 'GBP', // United Kingdom
  NO: 'NOK', // Norway
  SE: 'SEK', // Sweden
  DK: 'DKK', // Denmark
  PL: 'PLN', // Poland
  CZ: 'CZK', // Czech Republic
  
  // North America
  US: 'USD', // United States
  CA: 'CAD', // Canada (not in PRD but common)
  MX: 'MXN', // Mexico (not in PRD but common)
  
  // Add more as needed
}

/**
 * Get default currency for a country
 * @param country - Country name or ISO code (e.g., "Switzerland", "CH", "Germany", "DE")
 * @returns Currency code (e.g., "CHF", "EUR") or null if not found
 */
export function getCurrencyForCountry(country: string | null | undefined): string | null {
  if (!country) return null
  
  // Normalize country input
  const normalized = country.trim()
  
  // Try direct lookup by ISO code (uppercase)
  const upperNormalized = normalized.toUpperCase()
  if (COUNTRY_CURRENCY_MAP[upperNormalized]) {
    return COUNTRY_CURRENCY_MAP[upperNormalized]
  }
  
  // Try lookup by country name (case-insensitive)
  const countryNameMap: Record<string, string> = {
    'switzerland': 'CH',
    'germany': 'DE',
    'france': 'FR',
    'austria': 'AT',
    'united kingdom': 'GB',
    'uk': 'GB',
    'united states': 'US',
    'usa': 'US',
    'liechtenstein': 'LI',
    'belgium': 'BE',
    'netherlands': 'NL',
    'italy': 'IT',
    'spain': 'ES',
    'portugal': 'PT',
    'greece': 'GR',
    'ireland': 'IE',
    'finland': 'FI',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'poland': 'PL',
    'czech republic': 'CZ',
  }
  
  const countryCode = countryNameMap[normalized.toLowerCase()]
  if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
    return COUNTRY_CURRENCY_MAP[countryCode]
  }
  
  return null
}

/**
 * Check if a country is in the Eurozone
 */
export function isEurozoneCountry(country: string | null | undefined): boolean {
  const currency = getCurrencyForCountry(country)
  return currency === 'EUR'
}

/**
 * Check if currency override should prompt user
 * Returns true if user manually changed currency and then changed country
 */
export function shouldPromptCurrencyUpdate(
  currentCountry: string | null,
  previousCountry: string | null,
  currentCurrency: string | null,
  wasCurrencyManuallySet: boolean
): boolean {
  // Only prompt if:
  // 1. User manually set currency before
  // 2. Country changed
  // 3. New country has a different default currency
  if (!wasCurrencyManuallySet) return false
  if (!currentCountry || !previousCountry) return false
  if (currentCountry === previousCountry) return false
  
  const newDefaultCurrency = getCurrencyForCountry(currentCountry)
  if (!newDefaultCurrency) return false
  if (newDefaultCurrency === currentCurrency) return false
  
  return true
}

/**
 * Get list of common countries for dropdown
 * Returns array of { value, label } objects
 */
export function getCountryOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'Switzerland', label: 'Switzerland' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Austria', label: 'Austria' },
    { value: 'United Kingdom', label: 'United Kingdom' },
    { value: 'United States', label: 'United States' },
    { value: 'Liechtenstein', label: 'Liechtenstein' },
    { value: 'Belgium', label: 'Belgium' },
    { value: 'Netherlands', label: 'Netherlands' },
    { value: 'Italy', label: 'Italy' },
    { value: 'Spain', label: 'Spain' },
    { value: 'Portugal', label: 'Portugal' },
    { value: 'Greece', label: 'Greece' },
    { value: 'Ireland', label: 'Ireland' },
    { value: 'Finland', label: 'Finland' },
    { value: 'Sweden', label: 'Sweden' },
    { value: 'Norway', label: 'Norway' },
    { value: 'Denmark', label: 'Denmark' },
    { value: 'Poland', label: 'Poland' },
    { value: 'Czech Republic', label: 'Czech Republic' },
  ]
}




