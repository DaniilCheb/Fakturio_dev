/**
 * Contact Service
 * CRUD operations for contacts/customers using Supabase
 */

import { createServerSupabaseClient, getCurrentUserId } from "../supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Contact {
  id: string;
  user_id: string;
  type: "customer" | "supplier";
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  vat_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContactInput {
  type?: "customer" | "supplier";
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  vat_number?: string;
  notes?: string;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {}

/**
 * Get all contacts for the current user (server-side)
 */
export async function getContacts(): Promise<Contact[]> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching contacts:", error);
    throw new Error("Failed to fetch contacts");
  }
  
  return data || [];
}

/**
 * Get all contacts for a user (with explicit client)
 */
export async function getContactsWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching contacts:", error);
    throw new Error("Failed to fetch contacts");
  }
  
  return data || [];
}

/**
 * Get a single contact by ID (server-side)
 */
export async function getContactById(contactId: string): Promise<Contact | null> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching contact:", error);
    throw new Error("Failed to fetch contact");
  }
  
  return data;
}

/**
 * Get a single contact by ID (with explicit client)
 */
export async function getContactByIdWithClient(
  supabase: SupabaseClient,
  userId: string,
  contactId: string
): Promise<Contact | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching contact:", error);
    throw new Error("Failed to fetch contact");
  }
  
  return data;
}

/**
 * Save a new contact (server-side)
 */
export async function saveContact(contactData: CreateContactInput): Promise<Contact> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      type: contactData.type || "customer",
      name: contactData.name,
      company_name: contactData.company_name,
      email: contactData.email,
      phone: contactData.phone,
      address: contactData.address,
      city: contactData.city,
      postal_code: contactData.postal_code,
      country: contactData.country || "Switzerland",
      vat_number: contactData.vat_number,
      notes: contactData.notes,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating contact:", error);
    throw new Error("Failed to create contact");
  }
  
  return data;
}

/**
 * Save a new contact (with explicit client)
 */
export async function saveContactWithClient(
  supabase: SupabaseClient,
  userId: string,
  contactData: CreateContactInput
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      type: contactData.type || "customer",
      name: contactData.name,
      company_name: contactData.company_name,
      email: contactData.email,
      phone: contactData.phone,
      address: contactData.address,
      city: contactData.city,
      postal_code: contactData.postal_code,
      country: contactData.country || "Switzerland",
      vat_number: contactData.vat_number,
      notes: contactData.notes,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating contact:", error);
    throw new Error("Failed to create contact");
  }
  
  return data;
}

/**
 * Update an existing contact (server-side)
 */
export async function updateContact(
  contactId: string,
  updates: UpdateContactInput
): Promise<Contact> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating contact:", error);
    throw new Error("Failed to update contact");
  }
  
  if (!data) {
    throw new Error("Contact not found");
  }
  
  return data;
}

/**
 * Update an existing contact (with explicit client)
 */
export async function updateContactWithClient(
  supabase: SupabaseClient,
  userId: string,
  contactId: string,
  updates: UpdateContactInput
): Promise<Contact> {
  const { data, error } = await supabase
    .from("contacts")
    .update(updates)
    .eq("id", contactId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating contact:", error);
    throw new Error("Failed to update contact");
  }
  
  if (!data) {
    throw new Error("Contact not found");
  }
  
  return data;
}

/**
 * Delete a contact (server-side)
 */
export async function deleteContact(contactId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting contact:", error);
    throw new Error("Failed to delete contact");
  }
  
  return true;
}

/**
 * Delete a contact (with explicit client)
 */
export async function deleteContactWithClient(
  supabase: SupabaseClient,
  userId: string,
  contactId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting contact:", error);
    throw new Error("Failed to delete contact");
  }
  
  return true;
}

