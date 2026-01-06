/**
 * Time Entry Service - Client-side operations
 * These functions require an explicit Supabase client and user ID
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  invoice_id?: string;
  description?: string;
  date: string;           // ISO date
  start_time?: string;    // ISO timestamp
  end_time?: string;      // ISO timestamp
  duration_minutes: number;
  hourly_rate: number | null;
  is_billable: boolean;
  status: 'unbilled' | 'invoiced' | 'paid';
  is_running: boolean;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
    contact_id?: string;
  };
}

export interface CreateTimeEntryInput {
  project_id: string;
  description?: string;
  date: string;
  start_time?: string;  // ISO timestamp
  end_time?: string;    // ISO timestamp
  duration_minutes: number;
  hourly_rate?: number | null;
  is_billable?: boolean;
}

export interface StartTimerInput {
  project_id: string;
  description?: string;
  hourly_rate?: number | null;
  date?: string;
}

export interface TimeEntrySummary {
  project_id: string;
  project_name: string;
  total_minutes: number;
  total_hours: number;
  hourly_rate: number;
  total_amount: number;
  entry_ids: string[];
  date_range: { from: string; to: string };
}

/**
 * Get all time entries for user
 */
export async function getTimeEntriesWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, projects(name, contact_id)")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  
  if (error) {
    console.error("Error fetching time entries:", error);
    // Check if table doesn't exist
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn("time_entries table does not exist. Please run the migration: add-time-entries-table.sql");
      return []; // Return empty array instead of throwing
    }
    throw new Error(`Failed to fetch time entries: ${error.message || JSON.stringify(error)}`);
  }
  
  return data || [];
}

/**
 * Get unbilled time entries for a project
 */
export async function getUnbilledEntriesByProjectWithClient(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("status", "unbilled")
    .eq("is_billable", true)
    .order("date", { ascending: true });
  
  if (error) {
    console.error("Error fetching unbilled entries:", error);
    throw new Error("Failed to fetch unbilled entries");
  }
  
  return data || [];
}

/**
 * Get all billable time entries for a project
 */
export async function getBillableEntriesByProjectWithClient(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("is_billable", true)
    .order("date", { ascending: false });
  
  if (error) {
    console.error("Error fetching billable entries:", error);
    // Check if table doesn't exist
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn("time_entries table does not exist. Please run the migration: add-time-entries-table.sql");
      return []; // Return empty array instead of throwing
    }
    throw new Error(`Failed to fetch billable entries: ${error.message || JSON.stringify(error)}`);
  }
  
  return data || [];
}

/**
 * Manual time entry
 */
export async function createTimeEntryWithClient(
  supabase: SupabaseClient,
  userId: string,
  input: CreateTimeEntryInput
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: userId,
      ...input,
      is_running: false,
      status: 'unbilled',
      is_billable: input.is_billable ?? true,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating time entry:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      projectId: input.project_id,
    });
    
    // Check if table doesn't exist
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      throw new Error("Time tracking table not found. Please run the database migration: add-time-entries-table.sql");
    }
    
    // Check for RLS policy violations
    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error("Permission denied. Please check your database Row Level Security policies.");
    }
    
    // Check for foreign key violations
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      throw new Error("Invalid project. Please select a valid project.");
    }
    
    // Check for constraint violations (e.g., invalid status value)
    if (error.code === '23514' || error.message?.includes('check constraint')) {
      throw new Error("Invalid data. Please check all fields are valid.");
    }
    
    // Generic error with details
    throw new Error(`Failed to create time entry: ${error.message || error.code || 'Unknown error'}`);
  }
  
  return data;
}

/**
 * Start a timer
 */
export async function startTimerWithClient(
  supabase: SupabaseClient,
  userId: string,
  input: StartTimerInput
): Promise<TimeEntry> {
  // First, stop any running timers
  try {
    await stopAllTimersWithClient(supabase, userId);
  } catch (error) {
    // Log but don't fail if stopping timers fails (might be first timer)
    console.warn("Warning: Could not stop existing timers:", error);
  }
  
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const entryDate = input.date || today;
  
  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      user_id: userId,
      project_id: input.project_id,
      description: input.description,
      date: entryDate,
      start_time: now,
      duration_minutes: 0,
      hourly_rate: input.hourly_rate ?? null,
      is_running: true,
      is_billable: true,
      status: 'unbilled',
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error starting timer:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
      projectId: input.project_id,
    });
    
    // Check if table doesn't exist
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      throw new Error("Time tracking table not found. Please run the database migration: add-time-entries-table.sql");
    }
    
    // Check for RLS policy violations
    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('policy')) {
      throw new Error("Permission denied. Please check your database Row Level Security policies.");
    }
    
    // Check for foreign key violations
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      throw new Error("Invalid project. Please select a valid project.");
    }
    
    // Generic error with details
    throw new Error(`Failed to start timer: ${error.message || error.code || 'Unknown error'}`);
  }
  
  return data;
}

/**
 * Stop a running timer
 */
export async function stopTimerWithClient(
  supabase: SupabaseClient,
  userId: string,
  entryId: string
): Promise<TimeEntry> {
  // Get current entry to calculate duration
  const { data: entry, error: fetchError } = await supabase
    .from("time_entries")
    .select("*")
    .eq("id", entryId)
    .eq("user_id", userId)
    .single();
  
  if (fetchError || !entry) {
    throw new Error("Timer not found");
  }
  
  if (!entry.is_running) {
    throw new Error("Timer not running");
  }
  
  const now = new Date();
  const startTime = entry.start_time ? new Date(entry.start_time) : now;
  const durationMinutes = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 60000));
  
  const { data, error } = await supabase
    .from("time_entries")
    .update({
      end_time: now.toISOString(),
      duration_minutes: durationMinutes,
      is_running: false,
    })
    .eq("id", entryId)
    .select()
    .single();
  
  if (error) {
    console.error("Error stopping timer:", error);
    throw new Error("Failed to stop timer");
  }
  
  return data;
}

/**
 * Stop all running timers for user
 */
export async function stopAllTimersWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data: running, error } = await supabase
    .from("time_entries")
    .select("id")
    .eq("user_id", userId)
    .eq("is_running", true);
  
  // If table doesn't exist, just return (no timers to stop)
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return; // Table doesn't exist, nothing to stop
    }
    // For other errors, log but don't throw (might be first timer)
    console.warn("Warning: Could not check for running timers:", error);
    return;
  }
  
  if (running && running.length > 0) {
    for (const entry of running) {
      try {
        await stopTimerWithClient(supabase, userId, entry.id);
      } catch (error) {
        // Log but continue stopping other timers
        console.warn(`Warning: Could not stop timer ${entry.id}:`, error);
      }
    }
  }
}

/**
 * Get running timer (if any)
 */
export async function getRunningTimerWithClient(
  supabase: SupabaseClient,
  userId: string
): Promise<TimeEntry | null> {
  // Use maybeSingle() instead of single() to gracefully handle 0 rows without HTTP 406 error
  const { data, error } = await supabase
    .from("time_entries")
    .select("*, projects(name)")
    .eq("user_id", userId)
    .eq("is_running", true)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching running timer:", error);
    // Check if table doesn't exist
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.warn("time_entries table does not exist. Please run the migration: add-time-entries-table.sql");
      return null;
    }
    throw new Error(`Failed to fetch running timer: ${error.message || JSON.stringify(error)}`);
  }
  
  return data;
}

/**
 * Update a time entry
 */
export async function updateTimeEntryWithClient(
  supabase: SupabaseClient,
  userId: string,
  entryId: string,
  updates: Partial<CreateTimeEntryInput & { start_time?: string; end_time?: string }>
): Promise<TimeEntry> {
  const { data, error } = await supabase
    .from("time_entries")
    .update(updates)
    .eq("id", entryId)
    .eq("user_id", userId)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating time entry:", error);
    throw new Error("Failed to update time entry");
  }
  
  return data;
}

/**
 * Delete a time entry
 */
export async function deleteTimeEntryWithClient(
  supabase: SupabaseClient,
  userId: string,
  entryId: string
): Promise<void> {
  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error deleting time entry:", error);
    throw new Error("Failed to delete time entry");
  }
}

/**
 * Mark entries as invoiced
 */
export async function markEntriesAsInvoicedWithClient(
  supabase: SupabaseClient,
  userId: string,
  entryIds: string[],
  invoiceId: string
): Promise<void> {
  const { error } = await supabase
    .from("time_entries")
    .update({ 
      status: 'invoiced',
      invoice_id: invoiceId,
    })
    .in("id", entryIds)
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error marking entries as invoiced:", error);
    throw new Error("Failed to mark entries as invoiced");
  }
}

/**
 * Calculate summary for selected entries (for invoice generation)
 */
export function calculateTimeEntrySummary(
  entries: TimeEntry[],
  projectName: string
): TimeEntrySummary {
  if (entries.length === 0) {
    throw new Error("No entries provided");
  }
  
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const hourlyRate = entries[0]?.hourly_rate || 0; // Assuming same rate per project
  
  const dates = entries.map(e => e.date).sort();
  
  return {
    project_id: entries[0]?.project_id,
    project_name: projectName,
    total_minutes: totalMinutes,
    total_hours: Math.round((totalMinutes / 60) * 100) / 100, // Round to 2 decimals
    hourly_rate: hourlyRate,
    total_amount: Math.round((totalMinutes / 60) * hourlyRate * 100) / 100,
    entry_ids: entries.map(e => e.id),
    date_range: {
      from: dates[0],
      to: dates[dates.length - 1],
    },
  };
}

