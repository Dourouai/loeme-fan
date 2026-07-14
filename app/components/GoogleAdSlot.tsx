"use client";

import Script from "next/script";
import { useCallback, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, never>>;
  }
}

const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
const slotId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID;

export function GoogleAdSlot() {
  const requested = useRef(false);
  const configured = Boolean(clientId && slotId);

  const requestAd = useCallback(() => {
    if (!configured || requested.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      requested.current = true;
    } catch {
      // Keep the reserved layout stable when an ad or script is blocked.
    }
  }, [configured]);

  return (
    <aside className="home-ad" aria-label="Advertisement">
      <span className="home-ad-label">ADVERTISEMENT</span>
      {configured ? (
        <>
          <Script
            id="google-adsense"
            async
            crossOrigin="anonymous"
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
            onLoad={requestAd}
            onReady={requestAd}
          />
          <ins
            className="adsbygoogle"
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </>
      ) : (
        <div className="home-ad-placeholder">
          <span>Google Ads</span>
          <small>Responsive placement · 970 × 90</small>
        </div>
      )}
    </aside>
  );
}
