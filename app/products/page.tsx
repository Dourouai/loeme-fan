import type { Metadata } from "next";
import { GoogleAdSlot } from "../components/GoogleAdSlot";
import { SiteFooter, SiteHeader } from "../components/LoemeChrome";
import { ProductSections } from "../components/ProductShowcase";
import "../home.css";

export const metadata: Metadata = { title: "Products", description: "Meet Morph and Motif — two focused creative tools from Loeme." };

export default function ProductsPage() {
  return (
    <main className="loeme-site page-products">
      <section className="page-masthead">
        <SiteHeader active="products" />
        <div><span>PRODUCTS / 01—02</span><h1>Two instruments.<br /><em>One living system.</em></h1><p>Grow raw forms with Morph, then arrange them into repeatable systems with Motif.</p></div>
      </section>
      <section className="products"><ProductSections /></section>
      <section className="pipeline">
        <div className="pipeline-head"><span>ONE MATERIAL / TWO STATES</span><p>Follow a form from organic growth to a repeatable visual system.</p></div>
        <div className="pipeline-track"><div><i>01</i><b>GROW</b><span>Morph creates the raw material.</span></div><em>→</em><div><i>02</i><b>ARRANGE</b><span>Motif builds the visual system.</span></div></div>
      </section>
      <GoogleAdSlot />
      <SiteFooter />
    </main>
  );
}
