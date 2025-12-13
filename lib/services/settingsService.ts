/**
 * Settings Service
 * User settings, VAT, logo, preferences using Supabase
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
 * Get user profile (server-side)
 */
export async function getUserProfile(): Promise<Profile | null> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
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
 * Update user profile (server-side)
 */
export async function updateUserProfile(updates: UpdateProfileInput): Promise<Profile> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
  // Check if profile exists
  const existing = await getUserProfile();
  
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
    
    return data;
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: updates.email || "",
        ...updates,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating profile:", error);
      throw new Error("Failed to create profile");
    }
    
    return data;
  }
}

/**
 * Update user profile (with explicit client)
 */
export async function updateUserProfileWithClient(
  supabase: SupabaseClient,
  userId: string,
  updates: UpdateProfileInput
): Promise<Profile> {
  // Check if profile exists
  const existing = await getUserProfileWithClient(supabase, userId);
  
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
    
    return data;
  } else {
    // Create new profile
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        email: updates.email || "",
        ...updates,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating profile:", error);
      throw new Error("Failed to create profile");
    }
    
    return data;
  }
}

// ============ Logo ============

/**
 * Save user logo URL (server-side)
 * Note: Logo upload should be handled separately (e.g., via Supabase Storage)
 */
export async function saveLogo(logoUrl: string): Promise<void> {
  await updateUserProfile({ logo_url: logoUrl });
}

/**
 * Get user logo URL (server-side)
 */
export async function getLogo(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.logo_url || null;
}

/**
 * Delete user logo (server-side)
 */
export async function deleteLogo(): Promise<void> {
  await updateUserProfile({ logo_url: undefined });
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
 * Get VAT settings (server-side)
 */
export async function getVatSettings(): Promise<VatSettings> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
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
 * Update VAT settings (server-side)
 */
export async function updateVatSettings(updates: UpdateVatSettingsInput): Promise<VatSettings> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
  // Check if settings exist
  const existing = await getVatSettings();
  
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

// ============ Canton ============

/**
 * Get selected canton (server-side)
 */
export async function getCanton(): Promise<string | null> {
  const profile = await getUserProfile();
  return profile?.canton || null;
}

/**
 * Save selected canton (server-side)
 */
export async function saveCanton(cantonCode: string): Promise<void> {
  await updateUserProfile({ canton: cantonCode });
}

// ============ Account Currency ============

/**
 * Get account currency (server-side)
 */
export async function getAccountCurrency(): Promise<string> {
  const profile = await getUserProfile();
  return profile?.account_currency || "CHF";
}

/**
 * Save account currency (server-side)
 */
export async function saveAccountCurrency(currency: string): Promise<void> {
  await updateUserProfile({ account_currency: currency });
}

// ============ Description Suggestions ============

export interface DescriptionSuggestion {
  id: string;
  user_id: string;
  description: string;
  usage_count: number;
  last_used_at: string;
  created_at: string;
}

/**
 * Get description suggestions (server-side)
 */
export async function getDescriptionSuggestions(): Promise<DescriptionSuggestion[]> {
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("description_suggestions")
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false })
    .limit(50);
  
  if (error) {
    console.error("Error fetching description suggestions:", error);
    throw new Error("Failed to fetch description suggestions");
  }
  
  return data || [];
}

/**
 * Get description suggestions (with explicit client)
 */
export async function getDescriptionSuggestionsWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<DescriptionSuggestion[]> {
  const { data, error } = await supabase
    .from("description_suggestions")
    .select("*")
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false })
    .limit(50);
  
  if (error) {
    console.error("Error fetching description suggestions:", error);
    throw new Error("Failed to fetch description suggestions");
  }
  
  return data || [];
}

/**
 * Save a description suggestion (server-side)
 */
export async function saveDescriptionSuggestion(description: string): Promise<void> {
  if (!description || description.trim().length < 3) return;
  
  const { createServerSupabaseClient, getCurrentUserId } = await import("../supabase-server");
  const userId = await getCurrentUserId();
  const supabase = await createServerSupabaseClient();
  const trimmed = description.trim();
  
  // Check if suggestion already exists
  const { data: existing } = await supabase
    .from("description_suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("description", trimmed)
    .maybeSingle();
  
  if (existing) {
    // Update usage count and last_used_at
    await supabase
      .from("description_suggestions")
      .update({
        usage_count: existing.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new suggestion
    await supabase.from("description_suggestions").insert({
      user_id: userId,
      description: trimmed,
      usage_count: 1,
    });
  }
}

/**
 * Save a description suggestion (with explicit client)
 */
export async function saveDescriptionSuggestionWithClient(
  supabase: SupabaseClient,
  userId: string,
  description: string
): Promise<void> {
  if (!description || description.trim().length < 3) return;
  
  const trimmed = description.trim();
  
  // Check if suggestion already exists
  const { data: existing } = await supabase
    .from("description_suggestions")
    .select("*")
    .eq("user_id", userId)
    .eq("description", trimmed)
    .maybeSingle();
  
  if (existing) {
    // Update usage count and last_used_at
    await supabase
      .from("description_suggestions")
      .update({
        usage_count: existing.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new suggestion
    await supabase.from("description_suggestions").insert({
      user_id: userId,
      description: trimmed,
      usage_count: 1,
    });
  }
}

