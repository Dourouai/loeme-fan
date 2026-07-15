import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "../components/LoemeChrome";
import "../home.css";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Loeme uses local storage, analytics, and advertising services.",
};

export default function PrivacyPage() {
  return (
    <main className="loeme-site page-privacy">
      <section className="privacy-masthead">
        <SiteHeader active="privacy" />
        <div><span>LEGAL / PRIVACY</span><h1>Privacy,<br /><em>plainly.</em></h1><p>Last updated July 15, 2026</p></div>
      </section>
      <article className="privacy-content">
        <section><span>01</span><div><h2>What Loeme stores</h2><p>Loeme’s creative tools are designed to work locally in your browser. Projects, preferences, and imported design files may be stored on your device using browser storage. Unless a feature clearly says otherwise, these files are not uploaded to Loeme.</p></div></section>
        <section><span>02</span><div><h2>Google Analytics</h2><p>When configured, Loeme uses Google Analytics 4 to understand aggregate page visits and product usage. Google may process technical information such as pages viewed, device type, browser, approximate location, and referral source. Google Consent Mode starts analytics and advertising storage as denied; those settings may be updated only after a consent choice is supplied.</p></div></section>
        <section><span>03</span><div><h2>Google AdSense</h2><p>When configured, pages may display advertising provided by Google AdSense. Google and its partners may use cookies or similar technologies to deliver, measure, and personalize ads according to your region and consent choices.</p></div></section>
        <section><span>04</span><div><h2>Your choices</h2><p>You can block cookies and tracking through your browser settings, use privacy extensions, or decline consent where a consent message is presented. Some advertising may become non-personalized or unavailable.</p></div></section>
        <section><span>05</span><div><h2>Processing and retention</h2><p>Where local law requires consent, Loeme relies on your consent for analytics and personalized advertising. Google controls its own processing and retention practices; you can review them in <a href="https://policies.google.com/privacy">Google’s Privacy Policy</a>. Loeme keeps only the aggregate reports needed to understand and improve the site.</p></div></section>
        <section><span>06</span><div><h2>Contact</h2><p>Loeme is the operator of this website. Questions, access requests, or deletion requests can be sent to <a href="mailto:yancytien@gmail.com">yancytien@gmail.com</a>.</p></div></section>
      </article>
      <SiteFooter />
    </main>
  );
}
