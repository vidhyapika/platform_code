import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Vidhyapika",
  description: "AI-powered math learning platform for Grades 6-10 — structured curriculum, video lessons, AI tutoring, and live voice classrooms.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

