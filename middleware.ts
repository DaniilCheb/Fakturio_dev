import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",              // Guest invoice form (landing page)
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/zefix(.*)", // Zefix API is public for now
  "/invoice/view(.*)", // Public invoice view (token-based access)
]);

// Define onboarding routes that don't require profile completion
const isOnboardingRoute = createRouteMatcher([
  "/onboarding(.*)",
]);

/**
 * Create a Supabase client for middleware
 * Uses service role key to bypass RLS since we already verified the user via Clerk
 * This is necessary because the normal server client uses Clerk's auth() which doesn't work in middleware
 */
function createMiddlewareSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // #region agent log
  console.log('[DEBUG]', JSON.stringify({
    location: 'middleware.ts:27',
    message: 'Creating middleware Supabase client',
    data: {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyLength: supabaseServiceKey?.length || 0
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run5',
    hypothesisId: 'AI'
  }));
  // #endregion
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Middleware] Missing Supabase environment variables - SUPABASE_SERVICE_ROLE_KEY is required');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if user profile is complete
 * Profile is complete if: name, address, postal_code, and city are all present
 */
async function checkProfileComplete(userId: string): Promise<boolean> {
  try {
    const supabase = createMiddlewareSupabaseClient();
    
    if (!supabase) {
      console.error('[Middleware] Could not create Supabase client');
      // If we can't check, allow access (fail open)
      return true;
    }
    
    // Query profiles table directly using service role (bypasses RLS)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, address, postal_code, city")
      .eq("id", userId)
      .maybeSingle();
    
    // #region agent log
    const logData = {
      location: 'middleware.ts:55',
      message: 'Profile completeness check result (using service role)',
      data: {
        userId,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        hasProfile: !!profile,
        profileName: profile?.name,
        profileAddress: profile?.address,
        profilePostalCode: profile?.postal_code,
        profileCity: profile?.city,
        namePresent: !!profile?.name,
        addressPresent: !!profile?.address,
        postalCodePresent: !!profile?.postal_code,
        cityPresent: !!profile?.city,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run5',
      hypothesisId: 'AF'
    };
    // Note: Can't use fetch in middleware, will log via console and file write if possible
    console.log('[DEBUG]', JSON.stringify(logData));
    // #endregion
    
    if (error) {
      console.error("Error checking profile completeness:", error);
      // On error, allow access (fail open) to avoid blocking users
      return false;
    }
    
    if (!profile) {
      return false;
    }
    
    // Check all required fields are present
    const isComplete = !!(
      profile.name &&
      profile.address &&
      profile.postal_code &&
      profile.city
    );
    
    // #region agent log
    console.log('[DEBUG]', JSON.stringify({
      location: 'middleware.ts:106',
      message: 'Profile completeness final result',
      data: { userId, isComplete },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run5',
      hypothesisId: 'AG'
    }));
    // #endregion
    
    return isComplete;
  } catch (error) {
    console.error("Error in checkProfileComplete:", error);
    // On error, allow access (fail open)
    return false;
  }
}

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  
  // Redirect authenticated users from homepage to dashboard
  if (userId && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();
    
    // After authentication, check profile completeness
    if (userId) {
      // Allow access to onboarding routes
      if (isOnboardingRoute(request)) {
        return NextResponse.next();
      }
      
      // Check if profile is complete
      const isComplete = await checkProfileComplete(userId);
      
      // #region agent log
      console.log('[DEBUG]', JSON.stringify({
        location: 'middleware.ts:149',
        message: 'Middleware redirect decision',
        data: {
          pathname: request.nextUrl.pathname,
          userId,
          isComplete,
          willRedirect: !isComplete
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run5',
        hypothesisId: 'AH'
      }));
      // #endregion
      
      // If profile is incomplete, redirect to onboarding
      if (!isComplete) {
        return NextResponse.redirect(new URL("/onboarding/step-3", request.url));
      }
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
