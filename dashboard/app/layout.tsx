import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skippo Dashboard",
  description: "School operations dashboard for transport, academics, compliance, and parent communications.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
