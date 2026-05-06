import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import PageHero from "@/app/components/PageHero";
import BlogSection from "@/app/sections/BlogSection";
import TravelSection from "@/app/sections/TravelSection";
import LetsTalkSection from "@/app/sections/LetsTalkSection";

export const metadata: Metadata = {
  title: "Notebook — Essays on operations & leadership",
  description:
    "Real stories. Not LinkedIn posts. Essays from the road, the locker room, and the production office — plus a record of where I've been.",
  alternates: { canonical: "/notebook" },
};

export default function NotebookPage() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <PageHero
          eyebrow="Notebook"
          watermark="NOTEBOOK"
          titleTop="Real stories."
          titleBottom="Not LinkedIn posts."
          sub="Three essays, written slowly — and a map of where the road has taken me."
        />
        <BlogSection />
        <TravelSection />
        <LetsTalkSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
