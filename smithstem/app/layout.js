import "./globals.css";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";

// Chosen for their numerals. Smithstem is mostly figures — video counts, view
// counts, naira — and Plex draws digits that stay legible and line up in a
// column. Bundled at build time, so nothing is fetched from another server
// while a creator waits.
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const serif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = { title: "Smithstem", description: "Creator operations, one platform." };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-ground text-ink antialiased">{children}</body>
    </html>
  );
}
