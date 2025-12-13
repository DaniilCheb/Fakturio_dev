import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md p-4">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-orange-500 hover:bg-orange-600 text-white",
              footerActionLink: "text-orange-500 hover:text-orange-600",
              card: "shadow-xl",
            },
          }}
        />
      </div>
    </div>
  );
}

