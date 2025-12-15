import { ClerkProvider } from "@clerk/nextjs";
import { Radio_Canada_Big, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import QueryProvider from "@/lib/providers/QueryProvider";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <QueryProvider>
        <html lang="en">
          <body className={`${radioCanadaBig.variable} ${inter.variable}`}>
            <main>{children}</main>
            <Analytics />
          </body>
        </html>
      </QueryProvider>
    </ClerkProvider>
  );
}
