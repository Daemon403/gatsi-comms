import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PWARegister from "@/components/PWARegister";
import { getCurrentEmployee } from "@/lib/actions/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GATSI COMMS - Textile & Dry Cleaning Management",
  description:
    "Comprehensive digital management system for textile and dry cleaning operations",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "GATSI COMMS",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "GATSI COMMS",
    "application-name": "GATSI COMMS",
    "msapplication-tilecolor": "#059669",
    "msapplication-tileimage": "/icons/icon-144x144.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let employee = null;
  try {
    employee = await getCurrentEmployee();
  } catch {
    employee = null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#f8fafc]">
        <div className="flex h-full">
          {employee ? <Sidebar employee={employee} /> : null}
          <main className={employee ? "flex-1 overflow-auto lg:ml-64" : "flex-1 overflow-auto"}>
            {children}
          </main>
        </div>
        <PWARegister />
      </body>
    </html>
  );
}
