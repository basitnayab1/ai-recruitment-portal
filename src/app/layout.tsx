import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/providers/motion-provider";
import { ThemeBootstrapScript } from "@/components/providers/theme-bootstrap-script";
import "./globals.css";

const displaySans = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const displayMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.APP_NAME?.trim() || "RecruitAI";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} | AI-Powered Recruitment Portal`,
    template: `%s | ${appName}`,
  },
  description:
    "Find your next role faster with AI-matched job recommendations, real-time application tracking, and a hiring team that reviews every profile.",
  applicationName: appName,
  keywords: [
    "recruitment",
    "jobs",
    "AI hiring",
    "careers",
    "applicant tracking",
    "HR portal",
  ],
  authors: [{ name: appName }],
  creator: appName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: appName,
    title: `${appName} | AI-Powered Recruitment Portal`,
    description:
      "Find your next role faster with AI-matched job recommendations, real-time application tracking, and a hiring team that reviews every profile.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} | AI-Powered Recruitment Portal`,
    description:
      "Find your next role faster with AI-matched job recommendations, real-time application tracking, and a hiring team that reviews every profile.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displaySans.variable} ${displayMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeBootstrapScript />
      </head>
      <body className="flex min-h-full flex-col bg-[#06060a] font-sans text-zinc-200 antialiased">
        <MotionProvider>
          {children}
          <Toaster />
        </MotionProvider>
      </body>
    </html>
  );
}
