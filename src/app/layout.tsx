import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IntegrationHub — Connect All Your Apps",
  description: "One-click OAuth integration hub. Connect Facebook, Google, Slack, GitHub and 10+ more services with encrypted token storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
