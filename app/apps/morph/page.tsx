import type { Metadata } from "next";
import MorphStudio from "./MorphStudio";

export const metadata: Metadata = {
  title: "Morph — Organic Vector Lab",
  description:
    "Grow reaction-diffusion patterns, freeze a living moment, and shape it into editable SVG in Loeme Morph.",
};

export default function MorphPage() {
  return <MorphStudio />;
}
