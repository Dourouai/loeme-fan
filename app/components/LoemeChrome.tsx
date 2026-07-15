import Image from "next/image";
import Link from "next/link";

export function SiteHeader({ active }: { active: "home" | "products" | "labs" | "privacy" }) {
  return (
    <header className="site-nav">
      <Link href="/" className="site-logo" aria-label="Loeme home">
        <Image src="/brand/loeme-wordmark.svg" alt="LOEME" width={188} height={64} priority />
      </Link>
      <nav aria-label="Primary navigation">
        <Link className={active === "home" ? "is-active" : ""} href="/">Home</Link>
        <Link className={active === "products" ? "is-active" : ""} href="/products">Products</Link>
        <Link className={active === "labs" ? "is-active" : ""} href="/labs">Labs</Link>
      </nav>
      <a className="nav-launch" href="/apps/motif"><span>Launch Motif</span><i>↗</i></a>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Image src="/brand/loeme-wordmark.svg" alt="LOEME" width={188} height={64} />
      <p>Tools for living systems.</p>
      <div><Link href="/">Home</Link><Link href="/products">Products</Link><Link href="/labs">Labs</Link><Link href="/privacy">Privacy</Link></div>
      <span>© {new Date().getFullYear()} LOEME</span>
    </footer>
  );
}
