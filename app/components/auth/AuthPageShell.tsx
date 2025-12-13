import Image from "next/image";
import Link from "next/link";
import React from "react";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
};

/**
 * Shared centered layout for Clerk auth pages, styled with Fakturio design tokens.
 * Clerk widgets should be rendered as children with `appearance={clerkAppearance}`.
 */
export default function AuthPageShell({
  title,
  subtitle,
  children,
  backHref = "/",
  backLabel = "Back",
}: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-design-background overflow-visible relative">
      {/* Logo in top-left corner */}
      <div className="absolute top-4 left-4 z-10">
        <Link href="/">
          <Image
            src="/logo-dark.svg"
            alt="Fakturio"
            width={120}
            height={34}
            className="h-8 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo-dark-mode.svg"
            alt="Fakturio"
            width={120}
            height={34}
            className="hidden h-8 w-auto dark:block"
            priority
          />
        </Link>
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pt-36 pb-10 sm:pb-14 overflow-visible">
        <div className="mb-8 px-5">
          <div className="flex flex-col items-start text-left">
            <h1 className="text-[24px] leading-[30px] font-semibold text-design-content-default tracking-[-0.4px]">
              {title}
            </h1>
            <p
              className="mt-4 text-[15px] text-design-content-weak leading-relaxed"
              style={{ fontWeight: 400 }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        <div className="px-5 w-full overflow-visible">
          <div className="w-full overflow-visible">
            {children}
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] text-design-content-weak">
          By continuing, you agree to Fakturio's terms and privacy policy.
        </p>
      </div>
    </div>
  );
}

/**
 * Shared Clerk Appearance config that makes the widget match Fakturio styling.
 * Clerk's internal containers are made transparent so form elements appear directly on the background.
 */
export const clerkAppearance = {
  layout: {
    socialButtonsPlacement: "top",
    socialButtonsVariant: "blockButton",
  },
  elements: {
    rootBox: "w-full bg-transparent shadow-none border-0 ring-0 overflow-visible !overflow-visible",
    cardBox: "w-full bg-transparent shadow-none border-0 ring-0 overflow-visible !overflow-visible",
    // Clerk renders its own nested containers (card/main) depending on step (e.g. OTP).
    // Make all of them fully transparent so form elements appear directly on the background.
    card: "w-full bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 ring-0 !ring-0 p-0 overflow-visible !overflow-visible",
    main: "bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 ring-0 !ring-0 p-0 overflow-visible !overflow-visible",
    page: "bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 ring-0 !ring-0 p-0 overflow-visible !overflow-visible",
    form: "bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 ring-0 !ring-0 overflow-visible !overflow-visible",
    // Remove any internal grouping containers - make them transparent and remove spacing
    formButtonRow: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0 gap-0",
    formField: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0",
    formFieldRow: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0 gap-0",
    otpCodeField: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0",
    otpCodeFieldInputs: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0 gap-2",
    formResendCodeRow: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0",
    formFieldInputGroup: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0",
    formFieldInputShowPasswordButton: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none",
    formFields: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0 gap-0",
    formFieldInputContainer: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 m-0",
    // Additional container elements that might create the white card
    content: "bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 overflow-visible !overflow-visible",
    container: "bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 overflow-visible !overflow-visible",
    wrapper: "bg-transparent !bg-transparent shadow-none !shadow-none border-0 !border-0 overflow-visible !overflow-visible",

    // We provide our own page title/subtitle above; hide the Clerk header.
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",

    // Hide Clerk footer / branding / dev-mode callouts.
    footer: "hidden",
    footerAction: "hidden",
    footerActionText: "hidden",
    footerActionLink: "hidden",
    clerkLogoLink: "hidden",
    logoBox: "hidden",

    socialButtonsBlockButton:
      "h-[44px] rounded-full bg-design-surface-default border border-design-border-default hover:bg-design-surface-field transition-colors",
    socialButtonsBlockButtonText: "text-[14px] font-medium text-design-content-default",

    dividerLine: "bg-design-border-default",
    dividerText: "text-[12px] text-design-content-weak",
    dividerRow: "mt-1 -mb-2 !mt-1 !-mb-2",

    formFieldLabel: "text-[13px] font-medium text-design-content-weak",
    formFields: "bg-transparent !bg-transparent border-0 !border-0 shadow-none !shadow-none p-0 !p-0 m-0 !m-0 gap-0 !gap-0 mt-0 !mt-0",
    formFieldOptionalIndicator: "hidden",
    formFieldHintText: "hidden",
    formFieldInput:
      "h-[44px] rounded-xl bg-design-surface-default border border-design-border-default px-4 text-[14px] text-design-content-default placeholder:text-[#9D9B9A] focus:outline-none focus:ring-2 focus:ring-design-content-default/20 focus:border-design-content-default/30",

    formButtonPrimary:
      "h-[44px] rounded-full bg-design-button-primary text-design-on-button-content hover:opacity-90 active:opacity-80 transition-opacity",

    formFieldAction:
      "text-[12px] text-design-content-weak hover:text-design-content-default transition-colors",

    footerActionText: "text-[13px] text-design-content-weak",
    footerActionLink:
      "text-[13px] font-medium text-design-content-default hover:opacity-80 transition-opacity",

    formFieldErrorText: "text-[12px] text-red-600 dark:text-red-400",
    alertText: "text-[13px] text-design-content-weak",
    
    // Hide firstName and lastName fields
    formFieldFirstName: "hidden",
    formFieldLastName: "hidden",
  },
} as const;


