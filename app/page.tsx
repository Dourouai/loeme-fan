import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HomePlayground } from "./components/HomePlayground";
import "./home.css";

export const metadata: Metadata = {
  title: "Loeme — Creative tools for visual systems",
  description: "Generate, arrange, and move visual systems with focused creative tools built for the browser.",
};

const apps = [
  {
    index: "01",
    name: "Motif",
    verb: "Arrange",
    eyebrow: "PARAMETRIC VECTOR STUDIO",
    description: "Compose vector motifs, build repeat-aware layouts, and export clean SVG — all in the browser.",
    tags: ["SVG", "Pattern", "Local-first"],
    href: "/apps/motif",
    action: "Open Motif",
    status: "BETA",
    theme: "motif",
    icon: "/brand/motif-app-icon.svg",
  },
  {
    index: "02",
    name: "Flow",
    verb: "Move",
    eyebrow: "FLOW FIELD COMPOSER",
    description: "Direct thousands of forms with vortices, attraction, and repulsion. Freeze the moment that feels right.",
    tags: ["WebGPU", "Fields", "Motion"],
    href: "#flow",
    action: "Preview Flow",
    status: "IN DEVELOPMENT",
    theme: "flow",
    icon: "/brand/flow-app-icon.svg",
  },
  {
    index: "03",
    name: "Morph",
    verb: "Grow",
    eyebrow: "ORGANIC SHAPE LAB",
    description: "Seed living textures, watch them grow, then turn organic patterns into editable vector shapes.",
    tags: ["Growth", "Vector", "Generative"],
    href: "#morph",
    action: "Explore Morph",
    status: "EXPERIMENT",
    theme: "morph",
    icon: "/brand/morph-app-icon.svg",
  },
];

function AppVisual({ theme }: { theme: string }) {
  return (
    <div className={`app-visual app-visual-${theme}`} aria-hidden="true">
      <div className="visual-toolbar"><i /><i /><i /><span>UNTITLED / {theme.toUpperCase()}</span></div>
      {theme === "motif" && <div className="motif-grid">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}</div>}
      {theme === "flow" && <div className="flow-field"><b /><b /><b />{Array.from({ length: 54 }, (_, i) => <i key={i} />)}</div>}
      {theme === "morph" && <div className="morph-field"><i /><i /><i /><i /></div>}
      <div className="visual-status"><span>CANVAS 01</span><span>LIVE OUTPUT</span></div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="home-shell">
      <header className="home-nav">
        <Link href="/" className="home-brand" aria-label="Loeme home">
          <Image src="/brand/loeme-wordmark.svg" alt="Loeme" width={196} height={64} priority />
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#apps">Apps</a>
          <a href="#system">System</a>
          <a href="#labs">Labs</a>
        </nav>
        <Link className="nav-cta" href="/apps/motif">Open Motif <span>↗</span></Link>
      </header>

      <section className="hero">
        <div className="hero-kicker"><span>LOEME CREATIVE TOOLS</span><i>01—03</i></div>
        <div className="hero-grid">
          <div className="hero-copy">
            <h1>Make with<br /><em>systems.</em></h1>
            <p>Focused tools for generating, arranging, and moving visual forms — without leaving your browser.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#apps">Explore the apps <span>↓</span></a>
              <Link className="button-text" href="/apps/motif">Start with Motif <span>↗</span></Link>
            </div>
          </div>
          <div className="hero-canvas">
            <HomePlayground />
            <div className="canvas-note"><span>ONE FORM</span><i /><span>ENDLESS SYSTEMS</span></div>
          </div>
        </div>
        <div className="hero-index">
          <span>VECTOR NATIVE</span><i />
          <span>PARAMETRIC</span><i />
          <span>LOCAL FIRST</span><i />
          <span>MADE FOR PLAY</span>
        </div>
      </section>

      <section className="apps-section" id="apps">
        <div className="section-head">
          <div><span>THE TOOLBOX</span><b>Three focused apps.<br />One creative system.</b></div>
          <p>Start anywhere. Each tool is designed around one clear creative action, with a shared language that stays out of your way.</p>
        </div>
        <div className="app-list">
          {apps.map((app) => (
            <article className={`app-row app-row-${app.theme}`} id={app.theme} key={app.name}>
              <div className="app-number">{app.index}</div>
              <div className="app-copy">
                <div className="app-meta"><span>{app.eyebrow}</span><i>{app.status}</i></div>
                <Image className="app-icon" src={app.icon} alt={`${app.name} app icon`} width={64} height={64} />
                <h2>{app.name}<sup>{app.verb}</sup></h2>
                <p>{app.description}</p>
                <div className="app-tags">{app.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
                {app.href.startsWith("/") ? <Link className="app-link" href={app.href}>{app.action} <span>↗</span></Link> : <a className="app-link" href={app.href}>{app.action} <span>→</span></a>}
              </div>
              <AppVisual theme={app.theme} />
            </article>
          ))}
        </div>
      </section>

      <section className="system-section" id="system">
        <div className="system-title"><span>ONE SYSTEM</span><h2>Grow it. Arrange it.<br />Set it in motion.</h2></div>
        <div className="system-flow">
          <div><i>01</i><b>Morph</b><span>Generate organic forms</span></div>
          <strong>→</strong>
          <div><i>02</i><b>Motif</b><span>Compose visual systems</span></div>
          <strong>→</strong>
          <div><i>03</i><b>Flow</b><span>Direct movement & energy</span></div>
        </div>
        <p className="system-note">Each app works alone. Together, they turn a single form into an entire visual language.</p>
      </section>

      <section className="labs-section" id="labs">
        <div><span>LOEME LABS / 001</span><h2>Dustworks</h2><p>A playful particle automation experiment. Place machines, route dust, and watch a tiny system learn to clean itself.</p></div>
        <Link href="/apps/dustworks">Enter the experiment <span>↗</span></Link>
      </section>

      <footer className="home-footer">
        <div><Image src="/brand/loeme-wordmark.svg" alt="Loeme" width={196} height={64} /><p>Tools for making with systems.</p></div>
        <div><a href="#apps">Apps</a><a href="#system">System</a><a href="#labs">Labs</a></div>
        <span>© {new Date().getFullYear()} LOEME</span>
      </footer>
    </main>
  );
}
