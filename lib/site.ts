export const SITE_NAME = "Vidhyapika";
export const SITE_DESCRIPTION =
  "AI-powered math learning platform for Grades 6–10 — structured curriculum, video lessons, AI tutoring, and live voice classrooms.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.APP_URL ??
  "http://localhost:3000";

export const HOME_PAGE_TITLE = "AI Math Learning for Grades 6–10";

export function getHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/vidhyapika_one_line.png`,
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
      {
        "@type": "EducationalOrganization",
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
      },
    ],
  };
}
