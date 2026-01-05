import { ClerkProvider } from "@clerk/nextjs";
import { Radio_Canada_Big, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Suspense } from "react";
import "./globals.css";
import QueryProvider from "@/lib/providers/QueryProvider";
import NavigationProgress from "@/app/components/NavigationProgress";
import { LoadingBarProvider } from "@/app/components/LoadingBarContext";

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
        <LoadingBarProvider>
          <html lang="en">
            <body className={`${radioCanadaBig.variable} ${inter.variable}`}>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              <main>{children}</main>
              <Analytics />
              <SpeedInsights />
            </body>
          </html>
        </LoadingBarProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}
