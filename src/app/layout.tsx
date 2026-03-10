import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
<<<<<<< HEAD
  title: "ztkf-register",
  description: "Online Attendance Registration – WMSU College of Computing Studies",
=======
  title: "Zero Trust Fund Kids – Seminar Workshop",
  description: "Ticketed Attendance with One-Time QR System | Zero Trust Fund Kids",
  icons: {
    icon: "/ztfk-logo.png",
    apple: "/ztfk-logo.png",
  },
>>>>>>> 8c3c184b028badd86a2be2e5e166464d9e32864e
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
