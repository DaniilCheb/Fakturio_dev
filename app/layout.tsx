import {
  ClerkProvider,
} from "@clerk/nextjs";
import { Radio_Canada_Big } from "next/font/google";
import "./globals.css";

const radioCanadaBig = Radio_Canada_Big({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-radio-canada-big",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={radioCanadaBig.variable}>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
