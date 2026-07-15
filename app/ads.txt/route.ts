import { GOOGLE_ADSENSE_CLIENT_ID } from "../lib/google-config";

export async function GET() {
  const publisherId = GOOGLE_ADSENSE_CLIENT_ID.replace(/^ca-/, "");
  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "# Google AdSense publisher ID is not configured.\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
