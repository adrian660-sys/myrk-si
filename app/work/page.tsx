import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import PageHero from "@/app/components/PageHero";
import ExperienceSection from "@/app/sections/ExperienceSection";
import ResearchSection from "@/app/sections/ResearchSection";
import LetsTalkSection from "@/app/sections/LetsTalkSection";

export const metadata: Metadata = {
  title: "Work — Adrian Džeka · myrk.",
  description:
    "Selected research projects and the full track record. Market intelligence, procurement, payments, energy, and operational delivery.",
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <PageHero
          eyebrow="Work"
          watermark="WORK"
          titleTop="Different hat."
          titleBottom="Same standard."
          sub="Selected research projects, plus the full track record. Read the briefs, then scan the roles."
        />
        <ResearchSection />
        <ExperienceSection />
        <LetsTalkSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
