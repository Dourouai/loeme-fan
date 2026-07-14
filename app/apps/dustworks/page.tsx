import type { Metadata } from "next";
import Link from "next/link";
import "./dustworks.css";

export const metadata: Metadata = {
  title: "Dustworks",
  description: "Place airflow devices, route thousands of dust particles, and build a self-running cleaning system.",
};

export default function DustworksPage() {
  return (
    <main className="dustworks-shell">
      <div className="dustworks-fallback">
        <Link href="/">← Loeme</Link>
        <p>Loading Dustworks…</p>
      </div>
      <iframe
        className="dustworks-frame"
        src="/dustworks-game.html"
        title="Dustworks placement cleaning game"
        allow="autoplay"
      />
    </main>
  );
}
