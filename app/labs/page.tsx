import type { Metadata } from "next";
import { GoogleAdSlot } from "../components/GoogleAdSlot";
import { SiteFooter, SiteHeader } from "../components/LoemeChrome";
import "../home.css";

export const metadata: Metadata = { title: "Labs", description: "Loeme Labs is where we make interesting design tools and playful experiments." };

export default function LabsPage() {
  return (
    <main className="loeme-site page-labs">
      <section className="labs-hero">
        <SiteHeader active="labs" />
        <div className="labs-hero-copy"><span>LOEME LABS / OPEN</span><h1>We make interesting<br /><em>design tools.</em></h1><p>Labs is our space for small experiments, strange interactions, visual toys, and ideas that may become something bigger.</p><a href="mailto:yancytien@gmail.com">yancytien@gmail.com <b>↗</b></a></div>
        <div className="labs-hero-orbit" aria-hidden="true"><i /><i /><i /><b>PLAY</b></div>
      </section>

      <section className="lab-projects">
        <div className="lab-projects-head"><span>PLAYABLE / 001</span><p>Small things made to be touched.</p></div>
        <article className="dustworks-card">
          <div className="dustworks-copy"><span>MINI GAME · BROWSER</span><h2>Dustworks</h2><p>A tiny automation game. Place vacuums, fans, and cyclones, then build a system that cleans the dust by itself.</p><a href="/apps/dustworks">Play the mini game <b>↗</b></a></div>
          <div className="dustworks-field" aria-hidden="true">{Array.from({ length: 90 }, (_, index) => <i key={index} />)}<b className="machine machine-a">⌁</b><b className="machine machine-b">✣</b><b className="machine machine-c">↻</b><span>WAVE / 01</span></div>
        </article>
      </section>
      <GoogleAdSlot />
      <SiteFooter />
    </main>
  );
}
