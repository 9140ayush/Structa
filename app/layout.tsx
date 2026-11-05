import type { Metadata, Viewport } from "next";
import { Inter, Geist, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { themeInitScript } from "@/lib/theme";
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0C10" },
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "var(--primary)",
          colorPrimaryForeground: "var(--primary-foreground)",
          colorForeground: "var(--foreground)",
          colorMutedForeground: "var(--muted-foreground)",
          colorBackground: "var(--card)",
          colorInput: "var(--background)",
          colorInputForeground: "var(--foreground)",
          borderRadius: "0.375rem",
        },
      }}
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${inter.variable} ${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: themeInitScript,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-foreground">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
