import type { Metadata } from "next";
import SpaShell from "../spa/SpaShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CatchAllPage() {
  return <SpaShell />;
}
