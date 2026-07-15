import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GoogleAdSlot } from "./components/GoogleAdSlot";
import { SiteFooter, SiteHeader } from "./components/LoemeChrome";
import { products } from "./components/ProductShowcase";
import "./home.css";

export const metadata = {
  title: "Loeme — Tools for living systems",
  description: "Focused creative tools for growing, arranging, and moving visual systems in the browser.",
} satisfies Metadata;

function LivingField() {
  const nodes = Array.from({ length: 34 }, (_, index) => ({ left: 8 + ((index * 31) % 86), top: 9 + ((index * 47) % 80), delay: -((index * .17) % 3.4), size: index % 7 === 0 ? 8 : index % 3 === 0 ? 5 : 3 }));
  return (
    <div className="living-field" aria-label="An animated field of forms demonstrating Loeme's living systems">
      <div className="field-grid" /><div className="field-orbit field-orbit-a" /><div className="field-orbit field-orbit-b" /><div className="field-seed"><span>SEED</span></div><div className="field-pulse" />
      {nodes.map((node, index) => <i className={index % 7 === 0 ? "is-hot" : index % 5 === 0 ? "is-cool" : ""} key={index} style={{ "--x": `${node.left}%`, "--y": `${node.top}%`, "--d": `${node.delay}s`, "--s": `${node.size}px` } as CSSProperties} />)}
      <div className="field-caption"><span>LIVE SYSTEM / 001</span><b>34 FORMS</b></div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="loeme-site page-home">
      <section className="hero-dark">
        <SiteHeader active="home" />
        <div className="hero-stage">
          <div className="hero-statement">
            <div className="micro-label"><i /> CREATIVE SYSTEMS / BROWSER NATIVE</div>
            <h1>Tools for<br /><span>living</span> systems.</h1>
            <p>Loeme makes focused creative tools for growing forms, arranging patterns, and directing movement.</p>
            <div className="hero-links"><Link href="/products">Explore products <span>→</span></Link><Link href="/labs">Visit the lab <span>↗</span></Link></div>
          </div>
          <LivingField />
        </div>
        <div className="signal-strip"><div><span>01</span> GROW</div><i /><div><span>02</span> ARRANGE</div><i /><div><span>03</span> MOVE</div><i /><div><span>∞</span> EXPORT</div></div>
      </section>

      <section className="home-intro">
        <span>LOEME / ABOUT</span>
        <h2>We design the conditions.<br /><em>You discover the form.</em></h2>
        <p>Three independent products share one idea: creative software should make complex systems direct, playful, and useful.</p>
      </section>

      <section className="home-products">
        <div className="home-products-head"><span>THE PRODUCTS / 01—03</span><Link href="/products">View all products <b>→</b></Link></div>
        <div className="home-product-grid">
          {products.map(product => (
            <Link className={`home-product-card home-product-${product.theme}`} href={`/products#${product.theme}`} key={product.name}>
              <div><span>{product.number}</span><i>{product.status}</i></div>
              <Image src={product.icon} alt="" width={64} height={64} />
              <h3>{product.name}</h3><p>{product.action}</p><b>↗</b>
            </Link>
          ))}
        </div>
      </section>

      <GoogleAdSlot />

      <section className="home-split-links">
        <Link href="/products"><span>01 / PRODUCTS</span><h2>Meet the instruments.</h2><b>Explore →</b></Link>
        <Link href="/labs"><span>02 / LABS</span><h2>See what we are playing with.</h2><b>Enter ↗</b></Link>
      </section>
      <SiteFooter />
    </main>
  );
}
