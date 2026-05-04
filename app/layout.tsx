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

export const metadata: Metadata = {
  title: "Adrian Džeka — myrk.",
  description:
    "Project manager who reads the room, not just the brief. Based in Ljubljana.",
  keywords: ["project manager", "Ljubljana", "freelance", "myrk", "Adrian Džeka"],
  authors: [{ name: "Adrian Džeka" }],
  openGraph: {
    title: "Adrian Džeka — myrk.",
    description: "People first. Always.",
    url: "https://myrk.si",
    siteName: "myrk.",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adrian Džeka — myrk.",
    description: "People first. Always.",
  },
  robots: {
    index: true,
    follow: true,
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
