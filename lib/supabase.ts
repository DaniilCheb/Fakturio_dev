import { createClient } from "@supabase/supabase-js";

// Clerk auth disabled - these functions are stubs for now

/**
 * Create a Supabase client for server-side operations
 * Note: Clerk auth is disabled - this is a basic client without auth
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );
}

/**
 * Create a Supabase client for client-side operations
 * Note: Clerk auth is disabled - this is a basic client without auth
 */
export function createClientSupabaseClient(session: { getToken: () => Promise<string | null> } | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!
  );
}

/**
 * Get the current user ID
 * Note: Clerk auth is disabled - returns null
 */
export async function getCurrentUserId(): Promise<string> {
  throw new Error("Auth is disabled");
}

