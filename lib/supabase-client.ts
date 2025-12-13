import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Get environment variables - these are embedded at build time in Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Helper function to validate and get env vars with better error messages
function getSupabaseConfig() {
  if (!supabaseUrl) {
    const error = new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable.\n" +
      "This variable must be set BEFORE building your Next.js app.\n" +
      "If you just added it, you need to:\n" +
      "1. Set it in your deployment platform (Vercel/Netlify/etc.)\n" +
      "2. Redeploy your application (the build needs to run with the variable set)\n" +
      "Current value: " + (typeof supabaseUrl === 'undefined' ? 'undefined' : 'empty string')
    );
    console.error('[Supabase Client]', error.message);
    throw error;
  }

  if (!supabaseAnonKey) {
    const error = new Error(
      "Missing NEXT_PUBLIC_SUPABASE_KEY environment variable.\n" +
      "This variable must be set BEFORE building your Next.js app.\n" +
      "If you just added it, you need to:\n" +
      "1. Set it in your deployment platform (Vercel/Netlify/etc.)\n" +
      "2. Redeploy your application (the build needs to run with the variable set)\n" +
      "Current value: " + (typeof supabaseAnonKey === 'undefined' ? 'undefined' : 'empty string')
    );
    console.error('[Supabase Client]', error.message);
    throw error;
  }

  return { supabaseUrl, supabaseAnonKey };
}

/**
 * Create a Supabase client for client-side operations
 * Requires a session object with getToken function (from useSession)
 */
export function createClientSupabaseClient(
  session: { getToken: (options?: { template?: string }) => Promise<string | null> } | null
): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  
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
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createClient(supabaseUrl, supabaseAnonKey);
}

