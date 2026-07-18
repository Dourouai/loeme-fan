import Image from "next/image";
import Link from "next/link";

export const products = [
  {
    number: "01", name: "Motif", action: "Arrange", status: "Beta / Available",
    description: "Turn a handful of vector forms into repeatable compositions, patterns, and production-ready SVG.",
    tags: ["VECTOR NATIVE", "PARAMETRIC", "SVG OUTPUT"], href: "/apps/motif", cta: "Open Motif", theme: "motif", icon: "/brand/motif-app-icon.svg",
  },
  {
    number: "02", name: "Morph", action: "Grow", status: "Experiment",
    description: "Seed organic behavior, let it evolve, then freeze the right moment as an editable vector form.",
    tags: ["REACTION DIFFUSION", "ORGANIC", "VECTOR OUTPUT"], href: "/apps/morph", cta: "Open Morph", theme: "morph", icon: "/brand/morph-app-icon.svg",
  },
];

function ProductVisual({ theme }: { theme: string }) {
  if (theme === "motif") return (
    <div className="product-visual motif-visual" aria-hidden="true">
      <div className="visual-chrome"><span>COMPOSITION / 01</span><i>SEED 042</i></div>
      <div className="motif-art">{Array.from({ length: 30 }, (_, index) => <i key={index} />)}</div>
      <div className="visual-readout"><span>24 FORMS</span><span>REPEAT / ON</span><span>SVG</span></div>
    </div>
  );

  return (
    <div className="product-visual morph-visual" aria-hidden="true">
      <div className="visual-chrome"><span>GROWTH / CORAL</span><i>ITERATION 842</i></div>
      <div className="morph-art"><i /><i /><i /><i /><b /></div>
      <div className="visual-readout"><span>6 SHAPES</span><span>1,284 NODES</span><span>VECTOR READY</span></div>
    </div>
  );
}

export function ProductSections() {
  return products.map((product) => (
    <article className={`product product-${product.theme}`} id={product.theme} key={product.name}>
      <div className="product-topline"><span>{product.number}</span><i>{product.status}</i><b>{product.action}</b></div>
      <div className="product-layout">
        <div className="product-copy">
          <Image src={product.icon} alt={`${product.name} icon`} width={64} height={64} />
          <h2>{product.name}</h2><p>{product.description}</p>
          <div className="product-tags">{product.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
          {product.href.startsWith("/apps") ? (
            <a className="product-cta" href={product.href}>{product.cta}<span>↗</span></a>
          ) : (
            <Link className="product-cta" href={product.href}>{product.cta}<span>→</span></Link>
          )}
        </div>
        <ProductVisual theme={product.theme} />
      </div>
    </article>
  ));
}
