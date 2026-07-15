// Google measurement identifiers are public by design: they are included in
// page markup and ads.txt. Environment variables can override them per deploy.
export const GOOGLE_ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ??
  "ca-pub-2115668195727576";

export const GOOGLE_ADSENSE_SLOT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_SLOT_ID ?? "9060437642";

export const GOOGLE_ANALYTICS_ID =
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ?? "G-7HE8VQXGTQ";
