import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ijwi-learn.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c4d72",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | IJWI-LEARN",
    default: "IJWI-LEARN - Learn Kinyarwanda Online",
  },
  description:
    "Master the Kinyarwanda language with IJWI-LEARN. Interactive lessons, AI-powered conversation practice, video tutorials, tests, and certificates. From beginner to fluent, at your own pace.",
  keywords: [
    "Kinyarwanda",
    "learn Kinyarwanda",
    "Rwanda language",
    "Rwandan",
    "language learning",
    "Kinyarwanda lessons",
    "Rwanda",
    "African languages",
    "Bantu languages",
    "language course",
  ],
  authors: [{ name: "IJWI-LEARN" }],
  creator: "IJWI-LEARN",
  publisher: "IJWI-LEARN",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "IJWI-LEARN",
    title: "IJWI-LEARN - Learn Kinyarwanda Online",
    description:
      "Master the Kinyarwanda language with interactive lessons, AI-powered practice, video tutorials, and certificates.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IJWI-LEARN - Learn Kinyarwanda",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IJWI-LEARN - Learn Kinyarwanda Online",
    description:
      "Master the Kinyarwanda language with interactive lessons, AI-powered practice, video tutorials, and certificates.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": `${siteUrl}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
