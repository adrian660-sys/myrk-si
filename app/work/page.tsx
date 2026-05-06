import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import PageHero from "@/app/components/PageHero";
import ExperienceSection from "@/app/sections/ExperienceSection";
import WorkProjectsSection from "@/app/sections/WorkProjectsSection";
import LetsTalkSection from "@/app/sections/LetsTalkSection";

export const metadata: Metadata = {
  title: "Work — Adrian Džeka · myrk.",
  description:
    "Selected projects and the full track record. Tour management, project delivery, healthcare ops, sports operations, and creative production.",
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
          sub="Five selected projects and ten roles. Run the filter, read the record, decide if the standard matches what you need."
        />
        <WorkProjectsSection />
        <ExperienceSection />
        <LetsTalkSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
