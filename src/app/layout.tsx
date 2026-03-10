import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import BackgroundTerms from "@/components/BackgroundTerms";

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

        {/* 1 ── Background video (no tint, slight darken) */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          src="/bg.mp4"
          className="fixed inset-0 w-full h-full object-cover -z-30"
          style={{ filter: "brightness(0.7)" }}
        />

        {/* 2 ── Animated term definitions */}
        <BackgroundTerms />

        {/* 3 ── Very light frosted-glass layer (keeps UI readable) */}
        <div className="fixed inset-0 -z-10 backdrop-blur-[2px] bg-white/15" />

        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
