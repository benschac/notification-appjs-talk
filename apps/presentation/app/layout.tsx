import type { Metadata } from "next";

import "reveal.js/reveal.css";
import "reveal.js/theme/black.css";
import "shiki-magic-move/style.css";

import "../styles/global.css";

export const metadata: Metadata = {
  title: "Presentation",
  description: "Talk deck powered by Next.js and reveal.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
