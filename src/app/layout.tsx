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
  title: "ztkf-register",
  description: "Online Attendance Registration – Zero Trust Seminar Workshop",
  icons: {
    icon: "/ztfk-logo.png",
    apple: "/ztfk-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Full-screen background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          className="fixed inset-0 w-full h-full object-cover -z-10"
          src="/bg.mp4"
        />
        {/* Frosted-glass blur overlay so the video doesn't overpower the UI */}
        <div className="fixed inset-0 -z-10 backdrop-blur-sm bg-white/40" />

        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
