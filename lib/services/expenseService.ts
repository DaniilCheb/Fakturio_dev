/**
 * Expense Service
 * CRUD operations for expenses using Supabase
 */

import { createServerSupabaseClient, getCurrentUserId } from "../supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Expense {
  id: string;
  user_id: string;
  project_id?: string;
  contact_id?: string;
  name: string;
  description?: string;
  category?: "Office" | "Travel" | "Software" | "Equipment" | "Marketing" | "Professional Services" | "Other";
  type: "one-time" | "recurring" | "asset";
  amount: number;
  currency?: string;
  vat_amount?: number;
  vat_rate?: number;
  date: string;
  end_date?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseInput {
  project_id?: string;
  contact_id?: string;
  name: string;
  description?: string;
  category?: "Office" | "Travel" | "Software" | "Equipment" | "Marketing" | "Professional Services" | "Other";
  type?: "one-time" | "recurring" | "asset";
  amount: number;
  currency?: string;
  vat_amount?: number;
  vat_rate?: number;
  date: string;
  end_date?: string;
  receipt_url?: string;
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {}

/**
 * Get all expenses for the current user (server-side)
 */
export async function getExpenses(): Promise<Expense[]> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  
  if (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Failed to fetch expenses");
  }
  
  return data || [];
}

/**
 * Get all expenses (with explicit client)
 */
export async function getExpensesWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  
  if (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Failed to fetch expenses");
  }
  
  return data || [];
}

/**
 * Get a single expense by ID (server-side)
 */
export async function getExpenseById(expenseId: string): Promise<Expense | null> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching expense:", error);
    throw new Error("Failed to fetch expense");
  }
  
  return data;
}

/**
 * Get a single expense by ID (with explicit client)
 */
export async function getExpenseByIdWithClient(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching expense:", error);
    throw new Error("Failed to fetch expense");
  }
  
  return data;
}

/**
 * Save a new expense (server-side)
 */
export async function saveExpense(expenseData: CreateExpenseInput): Promise<Expense> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      project_id: expenseData.project_id,
      contact_id: expenseData.contact_id,
      name: expenseData.name,
      description: expenseData.description,
      category: expenseData.category,
      type: expenseData.type || "one-time",
      amount: expenseData.amount,
      currency: expenseData.currency || "CHF",
      vat_amount: expenseData.vat_amount,
      vat_rate: expenseData.vat_rate,
      date: expenseData.date,
      end_date: expenseData.end_date,
      receipt_url: expenseData.receipt_url,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating expense:", error);
    throw new Error("Failed to create expense");
  }
  
  return data;
}

/**
 * Save a new expense (with explicit client)
 */
export async function saveExpenseWithClient(
  supabase: SupabaseClient,
  userId: string,
  expenseData: CreateExpenseInput
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      project_id: expenseData.project_id,
      contact_id: expenseData.contact_id,
      name: expenseData.name,
      description: expenseData.description,
      category: expenseData.category,
      type: expenseData.type || "one-time",
      amount: expenseData.amount,
      currency: expenseData.currency || "CHF",
      vat_amount: expenseData.vat_amount,
      vat_rate: expenseData.vat_rate,
      date: expenseData.date,
      end_date: expenseData.end_date,
      receipt_url: expenseData.receipt_url,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating expense:", error);
    throw new Error("Failed to create expense");
  }
  
  return data;
}

/**
 * Update an existing expense (server-side)
 */
export async function updateExpense(
  expenseId: string,
  updates: UpdateExpenseInput
): Promise<Expense> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", expenseId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating expense:", error);
    throw new Error("Failed to update expense");
  }
  
  if (!data) {
    throw new Error("Expense not found");
  }
  
  return data;
}

/**
 * Update an existing expense (with explicit client)
 */
export async function updateExpenseWithClient(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string,
  updates: UpdateExpenseInput
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", expenseId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating expense:", error);
    throw new Error("Failed to update expense");
  }
  
  if (!data) {
    throw new Error("Expense not found");
  }
  
  return data;
}

/**
 * Delete an expense (server-side)
 */
export async function deleteExpense(expenseId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting expense:", error);
    throw new Error("Failed to delete expense");
  }
  
  return true;
}

/**
 * Delete an expense (with explicit client)
 */
export async function deleteExpenseWithClient(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting expense:", error);
    throw new Error("Failed to delete expense");
  }
  
  return true;
}

/**
 * Duplicate an expense (server-side)
 */
export async function duplicateExpense(expenseId: string): Promise<Expense> {
  const expense = await getExpenseById(expenseId);
  if (!expense) {
    throw new Error("Expense not found");
  }
  
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      project_id: expense.project_id,
      contact_id: expense.contact_id,
      name: `${expense.name} (copy)`,
      description: expense.description,
      category: expense.category,
      type: expense.type,
      amount: expense.amount,
      currency: expense.currency,
      vat_amount: expense.vat_amount,
      vat_rate: expense.vat_rate,
      date: expense.date,
      end_date: expense.end_date,
      receipt_url: expense.receipt_url,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error duplicating expense:", error);
    throw new Error("Failed to duplicate expense");
  }
  
  return data;
}

/**
 * Duplicate an expense (with explicit client)
 */
export async function duplicateExpenseWithClient(
  supabase: SupabaseClient,
  userId: string,
  expenseId: string
): Promise<Expense> {
  const expense = await getExpenseByIdWithClient(supabase, userId, expenseId);
  if (!expense) {
    throw new Error("Expense not found");
  }
  
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      project_id: expense.project_id,
      contact_id: expense.contact_id,
      name: `${expense.name} (copy)`,
      description: expense.description,
      category: expense.category,
      type: expense.type,
      amount: expense.amount,
      currency: expense.currency,
      vat_amount: expense.vat_amount,
      vat_rate: expense.vat_rate,
      date: expense.date,
      end_date: expense.end_date,
      receipt_url: expense.receipt_url,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error duplicating expense:", error);
    throw new Error("Failed to duplicate expense");
  }
  
  return data;
}

