import { InvoiceItem } from '../types/invoice'

/**
 * Calculate line item total (qty × price/um)
 * Note: UM is a unit of measure label (pcs, hour, kg), not a multiplier
 */
export function calculateItemTotal(item: InvoiceItem): number {
  const qty = parseFloat(String(item.quantity)) || 0
  const price = parseFloat(String(item.pricePerUm)) || 0
  return qty * price
}

/**
 * Calculate VAT amount for an item (additive mode)
 */
export function calculateItemVAT(item: InvoiceItem): number {
  const netTotal = calculateItemTotal(item)
  const vatRate = parseFloat(String(item.vat)) || 0
  return netTotal * (vatRate / 100)
}

/**
 * Calculate item total with VAT (additive mode)
 */
export function calculateItemTotalWithVAT(item: InvoiceItem): number {
  const netTotal = calculateItemTotal(item)
  const vatAmount = calculateItemVAT(item)
  return netTotal + vatAmount
}

/**
 * Calculate subtotal from all items
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
}

/**
 * Calculate total VAT amount from all items
 */
export function calculateTotalVAT(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemVAT(item), 0)
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(subtotal: number, discountPercent: number | string): number {
  const discount = parseFloat(String(discountPercent)) || 0
  return subtotal * (discount / 100)
}

/**
 * Calculate grand total (subtotal - discount + VAT)
 * Note: Discount is applied to subtotal, VAT is calculated on discounted subtotal proportionally
 */
export function calculateGrandTotal(
  items: InvoiceItem[],
  discountPercent: number | string
): {
  subtotal: number
  discountAmount: number
  subtotalAfterDiscount: number
  vatAmount: number
  total: number
  vatBreakdown: Record<string, { netAmount: number; vatAmount: number }>
} {
  const subtotal = calculateSubtotal(items)
  const discount = parseFloat(String(discountPercent)) || 0
  const discountAmount = calculateDiscountAmount(subtotal, discount)
  const subtotalAfterDiscount = subtotal - discountAmount

  // Group items by VAT rate and calculate VAT
  const vatGroups: Record<string, { netAmount: number; vatAmount: number }> = {}
  
  items.forEach(item => {
    const vatRate = parseFloat(String(item.vat)) || 0
    const itemNet = calculateItemTotal(item)
    
    if (!vatGroups[vatRate]) {
      vatGroups[vatRate] = { netAmount: 0, vatAmount: 0 }
    }
    vatGroups[vatRate].netAmount += itemNet
  })

  // Calculate VAT for each group
  let totalVAT = 0
  Object.keys(vatGroups).forEach(rate => {
    const rateNum = parseFloat(rate)
    const groupNet = vatGroups[rate].netAmount
    const groupVAT = groupNet * (rateNum / 100)
    vatGroups[rate].vatAmount = groupVAT
    totalVAT += groupVAT
  })

  // Apply discount proportionally to VAT
  const discountRatio = subtotal > 0 ? discountAmount / subtotal : 0
  const vatAfterDiscount = totalVAT * (1 - discountRatio)

  const total = subtotalAfterDiscount + vatAfterDiscount

  return {
    subtotal,
    discountAmount,
    subtotalAfterDiscount,
    vatAmount: vatAfterDiscount,
    total,
    vatBreakdown: vatGroups
  }
}

