import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import PageHero from "@/app/components/PageHero";
import SportsSection from "@/app/sections/SportsSection";
import LetsTalkSection from "@/app/sections/LetsTalkSection";

export const metadata: Metadata = {
  title: "Sports — Šiškarji & the school of leadership",
  description:
    "Co-founded Šiškarji in 2017 — football, basketball, volleyball, floorball. The locker room is where I learned how to run anything.",
  alternates: { canonical: "/sports" },
};

export default function SportsPage() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <PageHero
          eyebrow="Sports"
          watermark="ŠIŠKARJI"
          titleTop="Culture beats rules."
          titleBottom="Always."
          sub="Šiškarji — co-founded in 2017. Four sports, eight years, one culture: lead from the floor."
        />
        <SportsSection />
        <LetsTalkSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
