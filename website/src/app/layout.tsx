import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skippo — School transport, reimagined",
  description:
    "Skippo is the complete operations platform for school transport. Real-time tracking, SOS alerts, parent communication, and driver tools — all in one place.",
  keywords: ["school transport", "bus tracking", "parent app", "school safety", "skippo"],
  openGraph: {
    title: "Skippo — School transport, reimagined",
    description: "The complete operations platform for modern school transport.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-dark text-white antialiased">{children}</body>
    </html>
  );
}
