import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

/**
 * Create a Supabase client for server-side operations with Clerk auth
 * Uses the Clerk session token for Supabase RLS policies
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        // Get the Clerk token for Supabase
        const clerkToken = await getToken({ template: "supabase" });

        // Construct fetch headers
        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set("Authorization", `Bearer ${clerkToken}`);
        }

        // Call the original fetch
        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

/**
 * Create a Supabase client for client-side operations
 * Requires a session object with getToken function (from useSession)
 */
export function createClientSupabaseClient(
  session: { getToken: (options?: { template?: string }) => Promise<string | null> } | null
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await session?.getToken({ template: "supabase" });

        const headers = new Headers(options?.headers);
        if (clerkToken) {
          headers.set("Authorization", `Bearer ${clerkToken}`);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

/**
 * Create a basic Supabase client without authentication
 * For public data access only
 */
export function createPublicSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Get the current user ID from Clerk auth
 * For use in server-side code
 */
export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized: No user session found");
  }
  return userId;
}
