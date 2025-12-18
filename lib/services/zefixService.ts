/**
 * Zefix Service
 * Swiss company lookup via the Zefix API (Federal Registry of Commerce)
 * Documentation: https://www.zefix.admin.ch/ZefixPublicREST/v3/api-docs
 */

// Types based on Zefix API response
export interface ZefixAddress {
  organisation?: string;
  careOf?: string;
  street?: string;
  houseNumber?: string;
  addon?: string;
  poBox?: string;
  city?: string;
  swissZipCode?: string;
}

export interface ZefixLegalForm {
  id: number;
  uid: string;
  name: {
    de: string;
    fr: string;
    it: string;
    en: string;
  };
  shortName: {
    de: string;
    fr: string;
    it: string;
    en: string;
  };
}

export interface ZefixCompany {
  name: string;
  ehraid: number;
  uid: string;
  chid: string;
  legalSeatId: number;
  legalSeat: string;
  registryOfCommerceId: number;
  legalForm: ZefixLegalForm;
  status: 'ACTIVE' | 'CANCELLED' | 'BEING_CANCELLED';
  sogcDate: string | null;
  deletionDate: string | null;
  purpose?: string;
  address?: ZefixAddress;
  canton?: string;
  capitalNominal?: string;
  capitalCurrency?: string;
}

// Simplified company data for the invoice form
export interface CompanyInfo {
  name: string;
  address: string;
  zip: string;
  city: string;
  canton: string;
  legalForm: string;
  uid: string;
  status: string;
}

/**
 * Normalize UID format: CHE-123.456.789 → CHE123456789
 */
export function normalizeUid(uid: string): string {
  return uid.replace(/[-.\s]/g, '').toUpperCase();
}

/**
 * Format UID for display: CHE123456789 → CHE-123.456.789
 */
export function formatUid(uid: string): string {
  const normalized = normalizeUid(uid);
  if (normalized.length !== 12) return uid;
  
  const prefix = normalized.slice(0, 3);
  const part1 = normalized.slice(3, 6);
  const part2 = normalized.slice(6, 9);
  const part3 = normalized.slice(9, 12);
  
  return `${prefix}-${part1}.${part2}.${part3}`;
}

/**
 * Validate UID format (basic validation)
 */
export function isValidUid(uid: string): boolean {
  const normalized = normalizeUid(uid);
  return /^CHE\d{9}$/.test(normalized);
}

/**
 * Transform Zefix API response to simplified CompanyInfo
 */
export function transformZefixResponse(company: ZefixCompany): CompanyInfo {
  const address = company.address;
  
  // Build full street address
  let streetAddress = '';
  if (address?.street) {
    streetAddress = address.street;
    if (address.houseNumber) {
      streetAddress += ` ${address.houseNumber}`;
    }
  }
  
  return {
    name: company.name,
    address: streetAddress,
    zip: address?.swissZipCode || '',
    city: address?.city || '',
    canton: company.canton || '',
    legalForm: company.legalForm?.shortName?.de || '',
    uid: formatUid(company.uid),
    status: company.status,
  };
}


