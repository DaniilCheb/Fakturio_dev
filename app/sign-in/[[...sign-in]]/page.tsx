import { SignIn } from "@clerk/nextjs";
import AuthPageShell, { clerkAppearance } from "@/app/components/auth/AuthPageShell";

export default function SignInPage() {
  return (
    <AuthPageShell
      title="Welcome back"
      subtitle="Sign in to continue to Fakturio."
      backHref="/"
      backLabel="Back to invoice editor"
    >
      <SignIn 
        appearance={clerkAppearance}
        forceRedirectUrl="/dashboard"
      />
    </AuthPageShell>
  );
}

