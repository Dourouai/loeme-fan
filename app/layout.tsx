import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import {
  GOOGLE_ADSENSE_CLIENT_ID,
  GOOGLE_ANALYTICS_ID,
} from "./lib/google-config";
import "./globals.css";

const googleConsentDefaults = `window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "loeme.app";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: {
      default: "Loeme — Tools for living systems",
      template: "%s · Loeme",
    },
    description: "Focused creative tools for growing and arranging visual systems in the browser.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Loeme — Tools for living systems",
      description: "Grow forms. Arrange patterns.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1740, height: 907, alt: "Loeme tools for living systems" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Loeme — Tools for living systems",
      description: "Grow forms. Arrange patterns.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {GOOGLE_ANALYTICS_ID || GOOGLE_ADSENSE_CLIENT_ID ? (
          <script
            id="google-consent-defaults"
            dangerouslySetInnerHTML={{ __html: googleConsentDefaults }}
          />
        ) : null}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
      </body>
    </html>
  );
}
