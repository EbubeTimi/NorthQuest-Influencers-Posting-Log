import "./globals.css";
import localFont from "next/font/local";

// Chosen for their numerals. Smithstem is mostly figures — video counts, view
// counts, naira — and Plex draws digits that stay legible and line up in a
// column. Bundled at build time, so nothing is fetched from another server
// while a creator waits.
const sans = localFont({
  src: [
    { path: "../node_modules/@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@ibm/plex-sans/fonts/complete/woff2/IBMPlexSans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});
const serif = localFont({
  src: [
    { path: "../node_modules/@ibm/plex-serif/fonts/complete/woff2/IBMPlexSerif-Medium.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@ibm/plex-serif/fonts/complete/woff2/IBMPlexSerif-SemiBold.woff2", weight: "600", style: "normal" },
  ],
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
