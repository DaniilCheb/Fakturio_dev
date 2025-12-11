/**
 * Project Service
 * CRUD operations for projects using Supabase
 */

import { createServerSupabaseClient, getCurrentUserId } from "../supabase";
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
 * Get all projects for the current user (server-side)
 */
export async function getProjects(): Promise<Project[]> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
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
 * Get a single project by ID (server-side)
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
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
 * Get projects by customer ID (server-side)
 */
export async function getProjectsByCustomer(contactId: string): Promise<Project[]> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
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

/**
 * Save a new project (server-side)
 */
export async function saveProject(projectData: CreateProjectInput): Promise<Project> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      contact_id: projectData.contact_id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status || "active",
      hourly_rate: projectData.hourly_rate,
      budget: projectData.budget,
      currency: projectData.currency || "CHF",
      start_date: projectData.start_date,
      end_date: projectData.end_date,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
  
  return data;
}

/**
 * Save a new project (with explicit client)
 */
export async function saveProjectWithClient(
  supabase: SupabaseClient,
  userId: string,
  projectData: CreateProjectInput
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      contact_id: projectData.contact_id,
      name: projectData.name,
      description: projectData.description,
      status: projectData.status || "active",
      hourly_rate: projectData.hourly_rate,
      budget: projectData.budget,
      currency: projectData.currency || "CHF",
      start_date: projectData.start_date,
      end_date: projectData.end_date,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating project:", error);
    throw new Error("Failed to create project");
  }
  
  return data;
}

/**
 * Update an existing project (server-side)
 */
export async function updateProject(
  projectId: string,
  updates: UpdateProjectInput
): Promise<Project> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }
  
  if (!data) {
    throw new Error("Project not found");
  }
  
  return data;
}

/**
 * Update an existing project (with explicit client)
 */
export async function updateProjectWithClient(
  supabase: SupabaseClient,
  userId: string,
  projectId: string,
  updates: UpdateProjectInput
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating project:", error);
    throw new Error("Failed to update project");
  }
  
  if (!data) {
    throw new Error("Project not found");
  }
  
  return data;
}

/**
 * Delete a project (server-side)
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  const supabase = createServerSupabaseClient();
  
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
  
  return true;
}

/**
 * Delete a project (with explicit client)
 */
export async function deleteProjectWithClient(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
  
  return true;
}

