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
  // First check if profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  
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
      console.error("Error updating profile:", error);
      throw new Error("Failed to update profile");
    }
    
    result = data;
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        ...updates,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating profile:", error);
      throw new Error("Failed to create profile");
    }
    
    result = data;
  }
  
  return result;
}

