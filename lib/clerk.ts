import { auth, currentUser } from "@clerk/nextjs/server";

// Check if Clerk is configured
export const isClerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Get the current authenticated user's ID from Clerk
 * For use in Server Components and API Routes
 */
export async function getAuthUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Require authentication and return user ID
 * Throws if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Get the full current user object from Clerk
 * For use in Server Components
 */
export async function getAuthUser() {
  return await currentUser();
}

/**
 * Get a Supabase-compatible token from Clerk
 * This token can be used to authenticate with Supabase RLS
 */
export async function getSupabaseToken(): Promise<string | null> {
  const { getToken } = await auth();
  // Use the Supabase template to get a JWT that Supabase can verify
  return await getToken({ template: "supabase" });
}
