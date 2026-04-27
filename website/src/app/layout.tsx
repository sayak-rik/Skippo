import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skippo — India's AI-first school operations platform",
  description:
    "Skippo is the AI-first platform for schools — live GPS transport, AI lesson plans, fee collection via Razorpay, mass guardian calls, and analytics. Everything, one platform.",
  keywords: ["school operations", "AI school platform", "fee collection", "teacher AI", "school transport", "bus tracking", "parent app", "school safety", "skippo"],
  openGraph: {
    title: "Skippo — India's AI-first school operations platform",
    description: "Transport, fees, classes, guardian calls, and teacher AI — all in one platform.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white text-ink antialiased">{children}</body>
    </html>
  );
}
