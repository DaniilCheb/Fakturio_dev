/**
 * Bank Account Service
 * CRUD operations for bank accounts using Supabase
 */

import { createServerSupabaseClient, getCurrentUserId } from "../supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  iban: string;
  bic?: string;
  bank_name?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountInput {
  name: string;
  iban: string;
  bic?: string;
  bank_name?: string;
  is_default?: boolean;
}

export interface UpdateBankAccountInput extends Partial<CreateBankAccountInput> {}

/**
 * Get all bank accounts for the current user (server-side)
 */
export async function getBankAccounts(): Promise<BankAccount[]> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching bank accounts:", error);
    throw new Error("Failed to fetch bank accounts");
  }
  
  return data || [];
}

/**
 * Get all bank accounts (with explicit client)
 */
export async function getBankAccountsWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<BankAccount[]> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching bank accounts:", error);
    throw new Error("Failed to fetch bank accounts");
  }
  
  return data || [];
}

/**
 * Get the default bank account for the current user (server-side)
 */
export async function getDefaultBankAccount(): Promise<BankAccount | null> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching default bank account:", error);
    throw new Error("Failed to fetch default bank account");
  }
  
  // If no default found, return the first account
  if (!data) {
    const accounts = await getBankAccounts();
    return accounts[0] || null;
  }
  
  return data;
}

/**
 * Get the default bank account (with explicit client)
 */
export async function getDefaultBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<BankAccount | null> {
  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching default bank account:", error);
    throw new Error("Failed to fetch default bank account");
  }
  
  // If no default found, return the first account
  if (!data) {
    const accounts = await getBankAccountsWithClient(supabase, userId);
    return accounts[0] || null;
  }
  
  return data;
}

/**
 * Save a new bank account (server-side)
 */
export async function saveBankAccount(accountData: CreateBankAccountInput): Promise<BankAccount> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  // If this is marked as default or it's the first account, unset other defaults
  if (accountData.is_default) {
    await supabase
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("user_id", userId);
  } else {
    // Check if this will be the first account
    const existing = await getBankAccounts();
    if (existing.length === 0) {
      accountData.is_default = true;
    }
  }
  
  const { data, error } = await supabase
    .from("bank_accounts")
    .insert({
      user_id: userId,
      name: accountData.name,
      iban: accountData.iban,
      bic: accountData.bic,
      bank_name: accountData.bank_name,
      is_default: accountData.is_default || false,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating bank account:", error);
    throw new Error("Failed to create bank account");
  }
  
  return data;
}

/**
 * Save a new bank account (with explicit client)
 */
export async function saveBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string,
  accountData: CreateBankAccountInput
): Promise<BankAccount> {
  // If this is marked as default, unset other defaults
  if (accountData.is_default) {
    await supabase
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("user_id", userId);
  } else {
    // Check if this will be the first account
    const existing = await getBankAccountsWithClient(supabase, userId);
    if (existing.length === 0) {
      accountData.is_default = true;
    }
  }
  
  const { data, error } = await supabase
    .from("bank_accounts")
    .insert({
      user_id: userId,
      name: accountData.name,
      iban: accountData.iban,
      bic: accountData.bic,
      bank_name: accountData.bank_name,
      is_default: accountData.is_default || false,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating bank account:", error);
    throw new Error("Failed to create bank account");
  }
  
  return data;
}

/**
 * Update a bank account (server-side)
 */
export async function updateBankAccount(
  accountId: string,
  updates: UpdateBankAccountInput
): Promise<BankAccount> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  // If setting as default, unset others
  if (updates.is_default) {
    await supabase
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("user_id", userId)
      .neq("id", accountId);
  }
  
  const { data, error } = await supabase
    .from("bank_accounts")
    .update(updates)
    .eq("id", accountId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating bank account:", error);
    throw new Error("Failed to update bank account");
  }
  
  if (!data) {
    throw new Error("Bank account not found");
  }
  
  return data;
}

/**
 * Update a bank account (with explicit client)
 */
export async function updateBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  updates: UpdateBankAccountInput
): Promise<BankAccount> {
  // If setting as default, unset others
  if (updates.is_default) {
    await supabase
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("user_id", userId)
      .neq("id", accountId);
  }
  
  const { data, error } = await supabase
    .from("bank_accounts")
    .update(updates)
    .eq("id", accountId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating bank account:", error);
    throw new Error("Failed to update bank account");
  }
  
  if (!data) {
    throw new Error("Bank account not found");
  }
  
  return data;
}

/**
 * Delete a bank account (server-side)
 */
export async function deleteBankAccount(accountId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  // Check if this is the default account
  const account = await supabase
    .from("bank_accounts")
    .select("is_default")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();
  
  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting bank account:", error);
    throw new Error("Failed to delete bank account");
  }
  
  // If deleted account was default, make first remaining account default
  if (account.data?.is_default) {
    const remaining = await getBankAccounts();
    if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
      await supabase
        .from("bank_accounts")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }
  
  return true;
}

/**
 * Delete a bank account (with explicit client)
 */
export async function deleteBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string,
  accountId: string
): Promise<boolean> {
  // Check if this is the default account
  const account = await supabase
    .from("bank_accounts")
    .select("is_default")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();
  
  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting bank account:", error);
    throw new Error("Failed to delete bank account");
  }
  
  // If deleted account was default, make first remaining account default
  if (account.data?.is_default) {
    const remaining = await getBankAccountsWithClient(supabase, userId);
    if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
      await supabase
        .from("bank_accounts")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
    }
  }
  
  return true;
}

/**
 * Set a bank account as default (server-side)
 */
export async function setDefaultBankAccount(accountId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  // Unset all other defaults
  await supabase
    .from("bank_accounts")
    .update({ is_default: false })
    .eq("user_id", userId)
    .neq("id", accountId);
  
  // Set this one as default
  const { error } = await supabase
    .from("bank_accounts")
    .update({ is_default: true })
    .eq("id", accountId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error setting default bank account:", error);
    throw new Error("Failed to set default bank account");
  }
  
  return true;
}

/**
 * Set a bank account as default (with explicit client)
 */
export async function setDefaultBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string,
  accountId: string
): Promise<boolean> {
  // Unset all other defaults
  await supabase
    .from("bank_accounts")
    .update({ is_default: false })
    .eq("user_id", userId)
    .neq("id", accountId);
  
  // Set this one as default
  const { error } = await supabase
    .from("bank_accounts")
    .update({ is_default: true })
    .eq("id", accountId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error setting default bank account:", error);
    throw new Error("Failed to set default bank account");
  }
  
  return true;
}

