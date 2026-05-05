import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import ExperienceSection from "@/app/sections/ExperienceSection";
import TravelSection from "@/app/sections/TravelSection";
import WorkProjectsSection from "@/app/sections/WorkProjectsSection";

export const metadata: Metadata = {
  title: "Work — Adrian Džeka · myrk.",
  description: "Experience, projects, and travel — the full record of how I operate.",
};

export default function WorkPage() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        {/* Page header */}
        <section className="bg-[#080808] pt-36 pb-16 px-6 md:px-14">
          <div className="max-w-7xl mx-auto">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">Work</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-light text-cream leading-tight">
              Different hat.<br />Same standard.
            </h1>
          </div>
        </section>
        <ExperienceSection />
        <WorkProjectsSection />
        <TravelSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
