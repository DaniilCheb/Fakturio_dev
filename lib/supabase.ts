/**
 * @deprecated This file has been split for better separation of client and server code.
 * 
 * For client-side code, import from:
 * - `@/lib/supabase-client` - Client-safe Supabase functions
 * 
 * For server-side code, import from:
 * - `@/lib/supabase-server` - Server-only Supabase functions
 * 
 * This file only re-exports client-safe functions for backward compatibility.
 * Server functions are NOT re-exported here to prevent server-only code from being imported in client components.
 */

// Re-export only client-safe functions
export {
  createClientSupabaseClient,
  createPublicSupabaseClient,
} from "./supabase-client";
