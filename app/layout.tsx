import type { Metadata } from "next";
import { Inter, Geist, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-heading",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Structa — Understand Any Codebase",
  description:
    "Structa turns GitHub repositories into interactive 3D architecture maps with AI-generated insights and a grounded Ask-the-Codebase chat. Explore any public repo instantly — no signup required.",
  openGraph: {
    title: "Structa — Understand Any Codebase",
    description:
      "Structa turns GitHub repositories into interactive 3D architecture maps with AI-generated insights and a grounded Ask-the-Codebase chat. Explore any public repo instantly — no signup required.",
    type: "website",
    siteName: "Structa",
  },
  twitter: {
    card: "summary_large_image",
    title: "Structa — Understand Any Codebase",
    description:
      "Turn any GitHub repository into a navigable 3D architecture map with AI explanations you can question directly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html
        lang="en"
        className={`${inter.variable} ${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
