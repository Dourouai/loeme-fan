import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoogleAdSlot } from "./components/GoogleAdSlot";
import { HomePlayground } from "./components/HomePlayground";
import "./home.css";

export const metadata: Metadata = {
  title: "Loeme — Focused Design Tools",
  description: "A quiet home for focused tools for visual exploration, pattern making, and everyday design work.",
};

const tools = [
  {
    name: "Motif",
    eyebrow: "PARAMETRIC SVG STUDIO",
    description: "Compose vector motifs, shape repeat-aware layouts, and export production-ready SVG in the browser.",
    href: "/apps/motif",
    icon: "/brand/motif-app-icon.svg",
    tags: ["Vector", "Pattern", "Browser"],
    preview: "motif",
  },
  {
    name: "Dustworks",
    eyebrow: "AIRFLOW AUTOMATION GAME",
    description: "Place vacuums, fans, and cyclones. Route thousands of dust particles and build a cleaning system that runs itself.",
    href: "/apps/dustworks",
    icon: null,
    tags: ["Particles", "Automation", "Play"],
    preview: "dustworks",
  },
];

export default function Home() {
  return (
    <main className="home-shell">
      <header className="home-nav">
        <Link href="/" className="home-brand" aria-label="Loeme home">
          <Image src="/brand/loeme-wordmark.svg" alt="Loeme" width={196} height={64} priority />
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#tools">Product</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="home-intro" id="about">
        <div className="home-intro-copy">
          <span>LOEME DESIGN TOOLS</span>
          <h1>Small tools.<br />Serious play.</h1>
          <p>Focused creative utilities for exploring shapes, building visual systems, and making useful things in the browser.</p>
          <div className="home-intro-actions">
            <a href="#tools">Explore the product <span aria-hidden="true">↓</span></a>
            <small><i /> 02 tools are live</small>
          </div>
        </div>
        <HomePlayground />
      </section>

      <div className="home-signal-strip" aria-label="Loeme tool principles">
        <span>VECTOR NATIVE</span><i />
        <span>PARAMETRIC</span><i />
        <span>LOCAL FIRST</span><i />
        <span>MADE FOR PLAY</span>
      </div>

      <section className="home-tools" id="tools">
        <div className="home-section-heading">
          <div><span>PRODUCT</span><i>{String(tools.length).padStart(2, "0")}</i></div>
          <p>Available now</p>
        </div>

        <div className="home-tool-grid">
          {tools.map((tool) => (
            <Link className="home-tool-card" href={tool.href} key={tool.name}>
              <div className="home-tool-copy">
                {tool.icon ? (
                  <Image className="home-tool-icon" src={tool.icon} alt="" width={64} height={64} />
                ) : (
                  <div className="home-tool-icon home-tool-icon-dust" aria-hidden="true">↻</div>
                )}
                <span>{tool.eyebrow}</span>
                <h2>{tool.name}</h2>
                <p>{tool.description}</p>
                <div className="home-tool-tags">
                  {tool.tags.map((tag) => <i key={tag}>{tag}</i>)}
                </div>
              </div>

              <div className={`home-tool-preview ${tool.preview === "dustworks" ? "home-preview-dustworks" : ""}`} aria-hidden="true">
                <div className="home-preview-bar"><span>{tool.preview === "dustworks" ? "Workshop · Wave 01" : "Coastal Bloom"}</span><b><i /> LIVE</b></div>
                {tool.preview === "dustworks" ? (
                  <div className="home-preview-dust-field">
                    {Array.from({ length: 72 }, (_, index) => <i key={index} />)}
                    <b className="home-dust-device home-dust-vacuum">⌁</b>
                    <b className="home-dust-device home-dust-fan">✣</b>
                    <b className="home-dust-device home-dust-cyclone">↻</b>
                  </div>
                ) : (
                  <div className="home-preview-pattern">
                    {Array.from({ length: 30 }, (_, index) => <i key={index} />)}
                  </div>
                )}
              </div>

              <div className="home-tool-open">Open tool <span aria-hidden="true">↗</span></div>
            </Link>
          ))}
        </div>
      </section>

      <GoogleAdSlot />

      <footer className="home-footer">
        <Image src="/brand/loeme-wordmark.svg" alt="Loeme" width={196} height={64} />
        <p>Tools for making with systems.</p>
        <span>© {new Date().getFullYear()} Loeme</span>
      </footer>
    </main>
  );
}
