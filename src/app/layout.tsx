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

        {/* Background video — slightly darkened + desaturated for moodier look */}
        <video
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
          src="/bg.mp4"
          className="fixed inset-0 w-full h-full object-cover -z-30"
          style={{ filter: "brightness(0.65) saturate(1.15)" }}
        />

        {/* Emerald tint to tie the video into the app's green palette */}
        <div className="fixed inset-0 -z-20 bg-emerald-800/30 mix-blend-multiply" />

        {/* Frosted-glass layer so the UI stays readable */}
        <div className="fixed inset-0 -z-10 backdrop-blur-sm bg-white/25" />

        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
