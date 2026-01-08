'use client'

import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import AuthPageShell, { clerkAppearance } from "@/app/components/auth/AuthPageShell";
import Button from "@/app/components/Button";
import { AuthFormSkeleton } from "@/app/components/Skeleton";

type ForgotPasswordStep = 'email' | 'code';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>('email');
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

    // Detect which step we're on by checking for email or code input fields
    const detectStep = () => {
      if (!containerRef.current) return;
      
      // Check for code input field (verification step)
      const codeInput = containerRef.current.querySelector(
        'input[name="code"], input[type="text"][inputmode="numeric"], input[autocomplete="one-time-code"]'
      );
      
      // Check for email input field (email entry step)
      const emailInput = containerRef.current.querySelector(
        'input[name="emailAddress"], input[type="email"], input#emailAddress-field'
      );
      
      if (codeInput) {
        setCurrentStep('code');
      } else if (emailInput) {
        setCurrentStep('email');
      }
    };

    // Initial check after a short delay
    const timer = setTimeout(() => {
      if (!checkClerkLoaded()) {
        // If not loaded yet, poll for it
        const pollInterval = setInterval(() => {
          if (checkClerkLoaded()) {
            clearInterval(pollInterval);
            detectStep();
          }
        }, 100);

        // Stop polling after 3 seconds max
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsLoading(false);
          detectStep();
        }, 3000);
      } else {
        detectStep();
      }
    }, 300);

    // Watch for changes in the form (when user submits email and moves to code step)
    const observer = new MutationObserver(() => {
      detectStep();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const getTitle = () => {
    return currentStep === 'email' 
      ? "Reset your password"
      : "Check your email";
  };

  const getSubtitle = () => {
    return currentStep === 'email'
      ? "Enter your email to receive a password reset link."
      : "Enter the verification code we sent to your email address.";
  };

  return (
    <AuthPageShell
      title={getTitle()}
      subtitle={getSubtitle()}
      backHref="/sign-in"
      backLabel="Back to sign in"
      topRightButton={
        <Link href="/sign-in">
          <Button variant="secondary" size="default">
            Sign in
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
          routing="path"
          path="/forgot-password"
          fallbackRedirectUrl="/sign-in"
          forceRedirectUrl="/sign-in"
        />
      </div>
      <div className="mt-4 text-center">
        <Link 
          href="/sign-in"
          className="text-[13px] text-design-content-weak hover:text-design-content-default transition-colors"
        >
          Remember your password? Sign in
        </Link>
      </div>
    </AuthPageShell>
  );
}

