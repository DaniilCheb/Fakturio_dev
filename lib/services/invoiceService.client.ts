/**
 * Invoice Service - Client-side operations
 * These functions require an explicit Supabase client and user ID
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Invoice {
  id: string;
  user_id: string;
  contact_id: string;
  project_id?: string;
  bank_account_id: string;
  invoice_number: string;
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  currency: string;
  issued_on: string;
  due_date: string;
  paid_date?: string;
  subtotal: number;
  vat_amount: number;
  vat_rate: number;
  total: number;
  exchange_rate?: number;
  amount_in_account_currency?: number;
  from_info: Record<string, any>;
  to_info: Record<string, any>;
  items: Array<Record<string, any>>;
  notes?: string;
  payment_terms: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  contact_id: string;
  project_id?: string;
  bank_account_id: string;
  invoice_number?: string;
  status?: "draft" | "issued" | "paid" | "overdue" | "cancelled";
  currency?: string;
  issued_on: string;
  due_date: string;
  paid_date?: string;
  subtotal: number;
  vat_amount: number;
  vat_rate: number;
  total: number;
  exchange_rate?: number;
  amount_in_account_currency?: number;
  from_info: Record<string, any>;
  to_info: Record<string, any>;
  items: Array<Record<string, any>>;
  notes?: string;
  payment_terms: string;
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {
  status?: "draft" | "issued" | "paid" | "overdue" | "cancelled";
}

/**
 * Get all invoices (with explicit client)
 */
export async function getInvoicesWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching invoices:", error);
    throw new Error("Failed to fetch invoices");
  }
  
  return data || [];
}

/**
 * Get a single invoice by ID (with explicit client)
 */
export async function getInvoiceByIdWithClient(
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string
): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching invoice:", error);
    throw new Error("Failed to fetch invoice");
  }
  
  return data;
}

/**
 * Generate the next invoice number (with explicit client)
 * Always starts with 1 and increments based on total invoice count for the user
 */
async function generateInvoiceNumber(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  // Count all invoices for this user
  const { count, error } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error fetching invoice count:", error);
    throw new Error("Failed to generate invoice number");
  }
  
  // Next number is count + 1 (first invoice is 1, second is 2, etc.)
  const nextSequence = (count || 0) + 1;
  
  return nextSequence.toString();
}

/**
 * Save a new invoice (with explicit client)
 */
export async function saveInvoiceWithClient(
  supabase: SupabaseClient,
  userId: string,
  invoiceData: CreateInvoiceInput
): Promise<Invoice> {
  // Generate invoice number if not provided
  const invoiceNumber = invoiceData.invoice_number || await generateInvoiceNumber(supabase, userId);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'invoiceService.client.ts:145',message:'Inserting invoice with conversion data',data:{hasExchangeRate:invoiceData.exchange_rate !== undefined,exchangeRate:invoiceData.exchange_rate,hasAmountInAccountCurrency:invoiceData.amount_in_account_currency !== undefined,amountInAccountCurrency:invoiceData.amount_in_account_currency},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      contact_id: invoiceData.contact_id,
      project_id: invoiceData.project_id,
      bank_account_id: invoiceData.bank_account_id,
      invoice_number: invoiceNumber,
      status: invoiceData.status || "draft",
      currency: invoiceData.currency || "CHF",
      issued_on: invoiceData.issued_on,
      due_date: invoiceData.due_date,
      paid_date: invoiceData.paid_date,
      subtotal: invoiceData.subtotal,
      vat_amount: invoiceData.vat_amount,
      vat_rate: invoiceData.vat_rate,
      total: invoiceData.total,
      exchange_rate: invoiceData.exchange_rate,
      amount_in_account_currency: invoiceData.amount_in_account_currency,
      from_info: invoiceData.from_info,
      to_info: invoiceData.to_info,
      items: invoiceData.items,
      notes: invoiceData.notes,
      payment_terms: invoiceData.payment_terms,
    })
    .select()
    .single();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'invoiceService.client.ts:170',message:'Invoice inserted result',data:{hasError:!!error,error:error?.message,hasData:!!data,invoiceId:data?.id,currency:data?.currency,total:data?.total,exchangeRate:data?.exchange_rate,amountInAccountCurrency:data?.amount_in_account_currency},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  if (error) {
    console.error("Error creating invoice:", error);
    throw new Error("Failed to create invoice");
  }
  
  return data;
}

/**
 * Update an existing invoice (with explicit client)
 */
export async function updateInvoiceWithClient(
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string,
  updates: UpdateInvoiceInput
): Promise<Invoice> {
  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating invoice:", error);
    throw new Error("Failed to update invoice");
  }
  
  if (!data) {
    throw new Error("Invoice not found");
  }
  
  return data;
}

/**
 * Delete an invoice (with explicit client)
 */
export async function deleteInvoiceWithClient(
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting invoice:", error);
    throw new Error("Failed to delete invoice");
  }
  
  return true;
}

/**
 * Get invoice status based on dates and payment
 * This is a pure function that can be used in client components
 */
export function getInvoiceStatus(invoice: Invoice): "paid" | "overdue" | "pending" {
  if (invoice.status === "paid") return "paid";
  
  const dueDate = invoice.due_date;
  if (dueDate) {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (due < today) return "overdue";
  }
  
  return "pending";
}

