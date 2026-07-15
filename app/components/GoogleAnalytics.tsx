"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GOOGLE_ANALYTICS_ID } from "../lib/google-config";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    loemeGoogleAnalyticsReady?: boolean;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  useEffect(() => {
    const sendPageView = () => {
      if (!window.gtag || !window.loemeGoogleAnalyticsReady) return;
      const pagePath = query ? `${pathname}?${query}` : pathname;
      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    if (window.loemeGoogleAnalyticsReady) {
      sendPageView();
      return;
    }

    window.addEventListener("loeme:analytics-ready-v2", sendPageView, {
      once: true,
    });
    return () =>
      window.removeEventListener("loeme:analytics-ready-v2", sendPageView);
  }, [pathname, query]);

  if (!GOOGLE_ANALYTICS_ID) return null;

  return (
    <>
      <Script
        async
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', '${GOOGLE_ANALYTICS_ID}', { send_page_view: false, anonymize_ip: true });
window.loemeGoogleAnalyticsReady = true;
window.dispatchEvent(new Event('loeme:analytics-ready-v2'));`}
      </Script>
    </>
  );
}
