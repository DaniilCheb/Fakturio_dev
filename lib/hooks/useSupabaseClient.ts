"use client";

import { useSession } from "@clerk/nextjs";
import { useMemo } from "react";
import { createClientSupabaseClient } from "@/lib/supabase-client";

/**
 * Hook to get a Supabase client authenticated with Clerk
 * Use this in client components for database operations
 *
 * @example
 * const supabase = useSupabaseClient();
 * const { data } = await supabase.from('invoices').select('*');
 */
export function useSupabaseClient() {
  const { session } = useSession();

  const supabase = useMemo(() => {
    // Convert undefined to null for type compatibility
    return createClientSupabaseClient(session ?? null);
  }, [session]);

  return supabase;
}

/**
 * Hook to get the current user's ID from Clerk
 * Returns null if not authenticated
 */
export function useUserId(): string | null {
  const { session } = useSession();
  return session?.user?.id ?? null;
}

