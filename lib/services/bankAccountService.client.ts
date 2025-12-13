/**
 * Bank Account Service - Client-side operations
 * These functions require an explicit Supabase client and user ID
 */

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
  // If this is set as default, unset other defaults first
  if (accountData.is_default) {
    await supabase
      .from("bank_accounts")
      .update({ is_default: false })
      .eq("user_id", userId);
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
 * Update a bank account (with explicit client)
 */
export async function updateBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  updates: UpdateBankAccountInput
): Promise<BankAccount> {
  // If setting as default, unset other defaults first
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
 * Delete a bank account (with explicit client)
 */
export async function deleteBankAccountWithClient(
  supabase: SupabaseClient,
  userId: string,
  accountId: string
): Promise<boolean> {
  // First, check if this is the default account
  const { data: account, error: fetchError } = await supabase
    .from("bank_accounts")
    .select("is_default")
    .eq("id", accountId)
    .eq("user_id", userId)
    .single();
  
  if (fetchError) {
    console.error("Error fetching bank account:", fetchError);
    const errorMessage = fetchError.message || fetchError.details || fetchError.hint || "Failed to find bank account";
    throw new Error(`Failed to find bank account: ${errorMessage}`);
  }
  
  if (!account) {
    throw new Error("Bank account not found");
  }
  
  // Delete the account
  const { error } = await supabase
    .from("bank_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting bank account:", error);
    // Handle different error formats from Supabase
    const errorMessage = error.message || error.details || error.hint || JSON.stringify(error);
    throw new Error(`Failed to delete bank account: ${errorMessage}`);
  }
  
  // If deleted account was default, make first remaining account default
  if (account.is_default) {
    const remaining = await getBankAccountsWithClient(supabase, userId);
    if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
      const { error: updateError } = await supabase
        .from("bank_accounts")
        .update({ is_default: true })
        .eq("id", remaining[0].id)
        .eq("user_id", userId);
      
      if (updateError) {
        console.error("Error setting new default account:", updateError);
        // Don't throw here - deletion succeeded, just default reassignment failed
      }
    }
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
  // First, unset all defaults
  await supabase
    .from("bank_accounts")
    .update({ is_default: false })
    .eq("user_id", userId);

  // Then set the new default
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

