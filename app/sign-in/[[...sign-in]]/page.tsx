'use client'

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import AuthPageShell, { clerkAppearance } from "@/app/components/auth/AuthPageShell";
import Button from "@/app/components/Button";
import { AuthFormSkeleton } from "@/app/components/Skeleton";

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Clerk has rendered by looking for its form elements
    const checkClerkLoaded = () => {
      if (containerRef.current) {
        const hasForm = containerRef.current.querySelector('form, [class*="cl-"], [class*="clerk"]');
        if (hasForm) {
          setIsLoading(false);
          return true;
        }
      }
      return false;
    };

    // Initial check after a short delay
    const timer = setTimeout(() => {
      if (!checkClerkLoaded()) {
        // If not loaded yet, poll for it
        const pollInterval = setInterval(() => {
          if (checkClerkLoaded()) {
            clearInterval(pollInterval);
          }
        }, 100);

        // Stop polling after 3 seconds max
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsLoading(false);
        }, 3000);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to continue to Fakturio."
      backHref="/"
      backLabel="Back to invoice editor"
      topRightButton={
        <Link href="/sign-up">
          <Button variant="secondary" size="default">
            Create account
          </Button>
        </Link>
      }
    >
      <div ref={containerRef} className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-design-background">
            <AuthFormSkeleton />
          </div>
        )}
        <SignIn 
          appearance={clerkAppearance}
          forceRedirectUrl="/dashboard"
        />
      </div>
    </AuthPageShell>
  );
}

