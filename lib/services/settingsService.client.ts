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
    const insertData = {
      id: userId,
      ...updates,
    }
    const { data, error } = await supabase
      .from("profiles")
      .insert(insertData)
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

// ============ VAT Settings ============

export interface VatSettings {
  id: string;
  user_id: string;
  mode: "additive" | "inclusive";
  vat_number?: string;
  allow_custom_rate: boolean;
  default_rate: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateVatSettingsInput {
  mode?: "additive" | "inclusive";
  vat_number?: string;
  allow_custom_rate?: boolean;
  default_rate?: number;
}

/**
 * Get VAT settings (with explicit client)
 */
export async function getVatSettingsWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<VatSettings> {
  const { data, error } = await supabase
    .from("vat_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching VAT settings:", error);
    throw new Error("Failed to fetch VAT settings");
  }
  
  // Return defaults if not found
  if (!data) {
    return {
      id: "",
      user_id: userId,
      mode: "additive",
      vat_number: "",
      allow_custom_rate: false,
      default_rate: 8.1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  
  return data;
}

/**
 * Update VAT settings (with explicit client)
 */
export async function updateVatSettingsWithClient(
  supabase: SupabaseClient,
  userId: string,
  updates: UpdateVatSettingsInput
): Promise<VatSettings> {
  // Check if settings exist
  const existing = await getVatSettingsWithClient(supabase, userId);
  
  if (existing.id) {
    // Update existing
    const { data, error } = await supabase
      .from("vat_settings")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating VAT settings:", error);
      throw new Error("Failed to update VAT settings");
    }
    
    return data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("vat_settings")
      .insert({
        user_id: userId,
        mode: updates.mode || "additive",
        vat_number: updates.vat_number,
        allow_custom_rate: updates.allow_custom_rate || false,
        default_rate: updates.default_rate || 8.1,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating VAT settings:", error);
      throw new Error("Failed to create VAT settings");
    }
    
    return data;
  }
}

