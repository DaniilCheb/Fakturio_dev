import { SignUp } from "@clerk/nextjs";
import AuthPageShell, { clerkAppearance } from "@/app/components/auth/AuthPageShell";

export default function SignUpPage() {
  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Get started with Fakturio in under a minute."
      backHref="/"
      backLabel="Back to invoice editor"
    >
      <SignUp 
        appearance={clerkAppearance}
        forceRedirectUrl="/dashboard"
      />
    </AuthPageShell>
  );
}

