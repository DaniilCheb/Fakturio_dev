/**
 * Invoice Service
 * CRUD operations for invoices using Supabase
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
 * Get all invoices for the current user (server-side)
 */
export async function getInvoices(): Promise<Invoice[]> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
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
 * Get a single invoice by ID (server-side)
 */
export async function getInvoiceById(invoiceId: string): Promise<Invoice | null> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
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
    console.error("Error fetching invoice:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      invoiceId,
      userId
    });
    throw new Error(`Failed to fetch invoice: ${error.message || error.code || 'Unknown error'}`);
  }
  
  return data;
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
 * Generate next invoice number starting from 1 (server-side)
 * Always starts with 1 and increments based on total invoice count for the user
 */
export async function getNextInvoiceNumber(): Promise<string> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
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
 * Generate next invoice number (with explicit client)
 * Always starts with 1 and increments based on total invoice count for the user
 */
export async function getNextInvoiceNumberWithClient(
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
 * Save a new invoice (server-side)
 */
export async function saveInvoice(invoiceData: CreateInvoiceInput): Promise<Invoice> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
  // Generate invoice number if not provided
  const invoiceNumber = invoiceData.invoice_number || (await getNextInvoiceNumber());
  
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      contact_id: invoiceData.contact_id,
      project_id: invoiceData.project_id,
      bank_account_id: invoiceData.bank_account_id,
      invoice_number: invoiceNumber,
      status: invoiceData.status || "issued",
      currency: invoiceData.currency || "CHF",
      issued_on: invoiceData.issued_on,
      due_date: invoiceData.due_date,
      paid_date: invoiceData.paid_date,
      subtotal: invoiceData.subtotal,
      vat_amount: invoiceData.vat_amount,
      vat_rate: invoiceData.vat_rate,
      total: invoiceData.total,
      from_info: invoiceData.from_info,
      to_info: invoiceData.to_info,
      items: invoiceData.items,
      notes: invoiceData.notes,
      payment_terms: invoiceData.payment_terms,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating invoice:", error);
    throw new Error("Failed to create invoice");
  }
  
  return data;
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
  const invoiceNumber = invoiceData.invoice_number || (await getNextInvoiceNumberWithClient(supabase, userId));
  
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      contact_id: invoiceData.contact_id,
      project_id: invoiceData.project_id,
      bank_account_id: invoiceData.bank_account_id,
      invoice_number: invoiceNumber,
      status: invoiceData.status || "issued",
      currency: invoiceData.currency || "CHF",
      issued_on: invoiceData.issued_on,
      due_date: invoiceData.due_date,
      paid_date: invoiceData.paid_date,
      subtotal: invoiceData.subtotal,
      vat_amount: invoiceData.vat_amount,
      vat_rate: invoiceData.vat_rate,
      total: invoiceData.total,
      from_info: invoiceData.from_info,
      to_info: invoiceData.to_info,
      items: invoiceData.items,
      notes: invoiceData.notes,
      payment_terms: invoiceData.payment_terms,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating invoice:", error);
    throw new Error("Failed to create invoice");
  }
  
  return data;
}

/**
 * Update an existing invoice (server-side)
 */
export async function updateInvoice(
  invoiceId: string,
  updates: UpdateInvoiceInput
): Promise<Invoice> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
  // Filter out undefined values but keep null values (for clearing fields)
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  
  const { data, error } = await supabase
    .from("invoices")
    .update(cleanUpdates)
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating invoice:", {
      error,
      invoiceId,
      userId,
      updates: cleanUpdates,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
    });
    throw new Error(`Failed to update invoice: ${error.message || error.code || 'Unknown error'}`);
  }
  
  if (!data) {
    throw new Error("Invoice not found");
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
  // Filter out undefined values but keep null values (for clearing fields)
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );
  
  const { data, error } = await supabase
    .from("invoices")
    .update(cleanUpdates)
    .eq("id", invoiceId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating invoice:", {
      error,
      invoiceId,
      userId,
      updates: cleanUpdates,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
    });
    throw new Error(`Failed to update invoice: ${error.message || error.code || 'Unknown error'}`);
  }
  
  if (!data) {
    throw new Error("Invoice not found");
  }
  
  return data;
}

/**
 * Update invoice status (server-side)
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled",
  paidDate?: string
): Promise<Invoice> {
  const updates: UpdateInvoiceInput = { status };
  if (status === "paid" && paidDate) {
    updates.paid_date = paidDate;
  } else if (status !== "paid") {
    updates.paid_date = undefined;
  }
  
  return updateInvoice(invoiceId, updates);
}

/**
 * Update invoice status (with explicit client)
 */
export async function updateInvoiceStatusWithClient(
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string,
  status: "draft" | "issued" | "paid" | "overdue" | "cancelled",
  paidDate?: string
): Promise<Invoice> {
  const updates: UpdateInvoiceInput = { status };
  if (status === "paid" && paidDate) {
    updates.paid_date = paidDate;
  } else if (status !== "paid") {
    updates.paid_date = undefined;
  }
  
  return updateInvoiceWithClient(supabase, userId, invoiceId, updates);
}

/**
 * Delete an invoice (server-side)
 */
export async function deleteInvoice(invoiceId: string): Promise<boolean> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
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
 * Duplicate an invoice (server-side)
 */
export async function duplicateInvoice(invoiceId: string): Promise<Invoice> {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  const nextInvoiceNumber = await getNextInvoiceNumber();
  
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      contact_id: invoice.contact_id,
      project_id: invoice.project_id,
      bank_account_id: invoice.bank_account_id,
      invoice_number: nextInvoiceNumber,
      status: "issued",
      currency: invoice.currency,
      issued_on: new Date().toISOString().split("T")[0],
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      vat_amount: invoice.vat_amount,
      vat_rate: invoice.vat_rate,
      total: invoice.total,
      from_info: invoice.from_info,
      to_info: invoice.to_info,
      items: invoice.items,
      notes: invoice.notes,
      payment_terms: invoice.payment_terms,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error duplicating invoice:", error);
    throw new Error("Failed to duplicate invoice");
  }
  
  return data;
}

/**
 * Duplicate an invoice (with explicit client)
 */
export async function duplicateInvoiceWithClient(
  supabase: SupabaseClient,
  userId: string,
  invoiceId: string
): Promise<Invoice> {
  const invoice = await getInvoiceByIdWithClient(supabase, userId, invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }
  
  const nextInvoiceNumber = await getNextInvoiceNumberWithClient(supabase, userId);
  
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      user_id: userId,
      contact_id: invoice.contact_id,
      project_id: invoice.project_id,
      bank_account_id: invoice.bank_account_id,
      invoice_number: nextInvoiceNumber,
      status: "issued",
      currency: invoice.currency,
      issued_on: new Date().toISOString().split("T")[0],
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      vat_amount: invoice.vat_amount,
      vat_rate: invoice.vat_rate,
      total: invoice.total,
      from_info: invoice.from_info,
      to_info: invoice.to_info,
      items: invoice.items,
      notes: invoice.notes,
      payment_terms: invoice.payment_terms,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error duplicating invoice:", error);
    throw new Error("Failed to duplicate invoice");
  }
  
  return data;
}

/**
 * Get invoice status based on dates and payment
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

