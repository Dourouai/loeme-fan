import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

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
      default: "Loeme — Creative tools for visual systems",
      template: "%s · Loeme",
    },
    description: "Generate, arrange, and move visual systems with focused creative tools built for the browser.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Loeme — Make with systems",
      description: "Creative tools for generating, arranging, and moving visual forms.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1740, height: 907, alt: "Loeme creative tools for visual systems" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Loeme — Make with systems",
      description: "Creative tools for generating, arranging, and moving visual forms.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
