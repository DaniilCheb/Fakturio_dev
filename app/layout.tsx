import { ClerkProvider } from "@clerk/nextjs";
import { Radio_Canada_Big, Inter } from "next/font/google";
import "./globals.css";

const radioCanadaBig = Radio_Canada_Big({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-radio-canada-big",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

// Check if Clerk publishable key is available (needed for build time)
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <html lang="en">
      <body className={`${radioCanadaBig.variable} ${inter.variable}`}>
        <main>{children}</main>
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if the key is available
  if (clerkPubKey) {
    return <ClerkProvider publishableKey={clerkPubKey}>{content}</ClerkProvider>;
  }

  return content;
}
