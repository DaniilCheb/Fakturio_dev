import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client for server-side operations
 * Automatically injects Clerk JWT token
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    }
  );
}

/**
 * Create a Supabase client for client-side operations
 * Requires a session object from Clerk (use useSession() hook to get it)
 */
export function createClientSupabaseClient(session: { getToken: () => Promise<string | null> } | null) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      async accessToken() {
        return session ? await session.getToken() : null;
      },
    }
  );
}

/**
 * Get the current user ID from Clerk (server-side)
 */
export async function getCurrentUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

