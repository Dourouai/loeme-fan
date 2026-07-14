import type { Metadata } from "next";
import MotifStudio from "./MotifStudio";

export const metadata: Metadata = {
  title: "Motif — Parametric Vector Studio",
  description:
    "Compose, scatter, repeat and export SVG motifs in a focused browser workspace by Loeme.",
};

export default function MotifPage() {
  return <MotifStudio />;
}
