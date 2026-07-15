import type { Metadata } from "next";
import { GoogleAdSlot } from "../components/GoogleAdSlot";
import { SiteFooter, SiteHeader } from "../components/LoemeChrome";
import { ProductSections } from "../components/ProductShowcase";
import "../home.css";

export const metadata: Metadata = { title: "Products", description: "Meet Motif, Flow, and Morph — three focused creative tools from Loeme." };

export default function ProductsPage() {
  return (
    <main className="loeme-site page-products">
      <section className="page-masthead">
        <SiteHeader active="products" />
        <div><span>PRODUCTS / 01—03</span><h1>Three instruments.<br /><em>One living system.</em></h1><p>Grow raw forms with Morph, arrange them with Motif, and give them direction with Flow.</p></div>
      </section>
      <section className="products"><ProductSections /></section>
      <section className="pipeline">
        <div className="pipeline-head"><span>ONE MATERIAL / THREE STATES</span><p>Move a form through Loeme without losing its creative thread.</p></div>
        <div className="pipeline-track"><div><i>01</i><b>GROW</b><span>Morph creates the raw material.</span></div><em>→</em><div><i>02</i><b>ARRANGE</b><span>Motif builds the visual system.</span></div><em>→</em><div><i>03</i><b>MOVE</b><span>Flow gives it direction and energy.</span></div></div>
      </section>
      <GoogleAdSlot />
      <SiteFooter />
    </main>
  );
}
