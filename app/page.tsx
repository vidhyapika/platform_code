import type { Metadata } from "next";
import { getHomeJsonLd, HOME_PAGE_TITLE, SITE_DESCRIPTION } from "@/lib/site";
import SpaShell from "./spa/SpaShell";

export const metadata: Metadata = {
  title: HOME_PAGE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const jsonLd = getHomeJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpaShell />
    </>
  );
}
