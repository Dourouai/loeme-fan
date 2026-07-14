import type { Metadata } from "next";
import MotifStudio from "../MotifStudio";

export const metadata: Metadata = {
  title: "New Motif Project",
};

export default function NewMotifProjectPage() {
  return <MotifStudio startFresh />;
}
