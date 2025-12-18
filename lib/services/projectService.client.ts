/**
 * Project Service - Client-side operations
 * These functions require an explicit Supabase client and user ID
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface Project {
  id: string;
  user_id: string;
  contact_id?: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "archived";
  hourly_rate?: number;
  budget?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  contact_id?: string;
  name: string;
  description?: string;
  status?: "active" | "completed" | "archived";
  hourly_rate?: number;
  budget?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

/**
 * Get all projects (with explicit client)
 */
export async function getProjectsWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }
  
  return data || [];
}

/**
 * Get a single project by ID (with explicit client)
 */
export async function getProjectByIdWithClient(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching project:", error);
    throw new Error("Failed to fetch project");
  }
  
  return data;
}

/**
 * Get projects by customer ID (with explicit client)
 */
export async function getProjectsByCustomerWithClient(
  supabase: SupabaseClient,
  userId: string,
  contactId: string
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching projects by customer:", error);
    throw new Error("Failed to fetch projects");
  }
  
  return data || [];
}


