/**
 * Settings Service - Client-side operations
 * These functions require an explicit Supabase client and user ID
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// ============ User Profile ============

export interface Profile {
  id: string;
  email: string;
  name?: string;
  company_name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  vat_number?: string;
  canton?: string;
  account_currency?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  email?: string;
  name?: string;
  company_name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  vat_number?: string;
  canton?: string;
  account_currency?: string;
  logo_url?: string;
}

/**
 * Get user profile (with explicit client)
 */
export async function getUserProfileWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
  
  return data;
}

/**
 * Update user profile (with explicit client)
 */
export async function updateUserProfileWithClient(
  supabase: SupabaseClient,
  userId: string,
  updates: UpdateProfileInput
): Promise<Profile> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'settingsService.client.ts:67',message:'updateUserProfileWithClient entry',data:{userId,hasEmail:!!updates.email,email:updates.email,updatesKeys:Object.keys(updates)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // First check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'settingsService.client.ts:77',message:'Profile existence check result',data:{hasExisting:!!existing,existingId:existing?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  let result;
  
  if (existing) {
    // Update existing profile
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    
    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'settingsService.client.ts:92',message:'Error updating profile',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      console.error("Error updating profile:", error);
      throw new Error("Failed to update profile");
    }
    
    result = data;
  } else {
    // Create new profile
    const insertData = {
      id: userId,
      ...updates,
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'settingsService.client.ts:103',message:'Insert data before DB call',data:{hasEmail:!!insertData.email,email:insertData.email,hasId:!!insertData.id,insertKeys:Object.keys(insertData)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase
      .from("profiles")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a13d31c8-2d36-4a68-a9b4-e79d6903394a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'settingsService.client.ts:109',message:'Error creating profile',data:{errorCode:error.code,errorMessage:error.message,errorDetails:error.details,errorHint:error.hint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      console.error("Error creating profile:", error);
      throw new Error("Failed to create profile");
    }
    
    result = data;
  }
  
  return result;
}


