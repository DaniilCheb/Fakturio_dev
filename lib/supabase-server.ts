import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

/**
 * NOTE: This file should only be used in server components and API routes.
 * Do not import this file in client components - use supabase-client.ts instead.
 */

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
        let clerkToken: string | null = null;
        try {
          clerkToken = await getToken({ template: "supabase" });
          if (!clerkToken) {
            console.warn('[Supabase Server] No token returned from Clerk - JWT template "supabase" may not exist');
          }
        } catch (tokenError) {
          console.error('[Supabase Server] Error getting Clerk token:', tokenError);
        }

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

