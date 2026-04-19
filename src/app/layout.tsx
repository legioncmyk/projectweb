import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ZallTopUp - Top Up Game Murah & Cepat | 65+ Game Tersedia",
    template: "%s | ZallTopUp",
  },
  description:
    "Top up game murah, cepat, dan terpercaya di Indonesia. Mobile Legends, Free Fire, PUBG Mobile, Valorant, Genshin Impact, Honkai Star Rail, dan 60+ game lainnya. Proses instan 24 jam, harga mulai Rp1.000.",
  keywords: [
    "top up game murah",
    "top up mobile legends",
    "top up free fire",
    "top up pubg mobile",
    "top up valorant",
    "top up genshin impact",
    "top up honkai star rail",
    "diamond ml murah",
    "diamond ff murah",
    "UC pubg murah",
    "VP valorant murah",
    "top up game online",
    "beli diamond murah",
    "top up game terpercaya",
    "top up game cepat",
    "top up game instan",
    "jual diamond ml",
    "jual diamond ff",
    "top up clash of clans",
    "top up brawl stars",
    "top up clash royale",
    "top up game termurah",
    "zalltopup",
    "top up dana",
  ],
  authors: [{ name: "Zall Store", url: "https://zalltopup.com" }],
  creator: "Zall Store",
  publisher: "Zall Store",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  metadataBase: new URL('https://zalltopup.com'),
  alternates: {
    canonical: 'https://zalltopup.com',
  },
  openGraph: {
    title: "ZallTopUp - Top Up Game Murah & Cepat | 65+ Game Tersedia",
    description:
      "Top up game murah, cepat, dan terpercaya. Mobile Legends, Free Fire, PUBG Mobile, Valorant, Genshin Impact, dan 60+ game lainnya. Proses instan, harga mulai Rp1.000.",
    type: "website",
    locale: "id_ID",
    siteName: "ZallTopUp",
    url: "https://zalltopup.com",
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'ZallTopUp - Top Up Game Murah dan Cepat',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZallTopUp - Top Up Game Murah & Cepat",
    description:
      "Top up game murah, cepat, dan terpercaya. 65+ game tersedia, proses instan, harga mulai Rp1.000.",
    images: ['/logo.png'],
    creator: "@zalltopup",
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
  verification: {},
  category: "games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="canonical" href="https://zalltopup.com" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZallTopUp" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="geo.region" content="ID" />
        <meta name="geo.country" content="ID" />
        <meta name="language" content="id-ID" />
        <meta name="revisit-after" content="1 days" />
        <meta name="rating" content="general" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
