import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

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

        if (!clerkToken) {
          console.warn('[Supabase Client] No Clerk token available - JWT template "supabase" may not be configured')
        }

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

