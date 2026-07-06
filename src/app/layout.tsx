import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { Toaster } from "@/components/ui/sonner";
import { uploadRouter } from "@/app/api/uploadthing/core";
import "./globals.css";

// Display: technical grotesque, drafting-table feel — used for headings only.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Body: engineered, highly legible.
const plexSans = IBM_Plex_Sans({
  variable: "--font-sans-src",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Data/instrument: gauge numerals, ticks, labels.
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Resume Analyzer",
    template: "%s · AI Resume Analyzer",
  },
  description:
    "AI-powered resume analysis: ATS scores, job description matching, and recruiter-grade rewrites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
