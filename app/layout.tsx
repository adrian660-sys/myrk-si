import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const SITE = "https://myrk.si";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Adrian Džeka — Project Manager, Ljubljana | myrk.",
    template: "%s | Adrian Džeka — myrk.",
  },
  description:
    "Adrian Džeka — freelance project manager based in Ljubljana. Tour management, real estate, healthcare ops, live events.",
  keywords: [
    "project manager Ljubljana",
    "freelance project manager Slovenia",
    "tour manager Slovenia",
    "production manager Ljubljana",
    "event manager Slovenia",
    "Adrian Džeka",
    "myrk",
  ],
  authors: [{ name: "Adrian Džeka" }],
  creator: "Adrian Džeka",
  openGraph: {
    title: "Adrian Džeka — Project Manager, Ljubljana",
    description: "People first. Always.",
    url: SITE,
    siteName: "myrk.",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrian Džeka — Project Manager, Ljubljana",
    description: "People first. Always.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
