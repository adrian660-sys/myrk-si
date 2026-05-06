import type { Metadata } from "next";
import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import BlogSection from "@/app/sections/BlogSection";

export const metadata: Metadata = {
  title: "Notebook — Essays on Operations & Leadership",
  description: "Real stories. Not LinkedIn posts.",
  alternates: { canonical: "/notebook" },
};

export default function NotebookPage() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        {/* Page header */}
        <section className="bg-[#080808] pt-36 pb-16 px-6 md:px-14">
          <div className="max-w-7xl mx-auto">
            <p className="font-sans text-xs tracking-[0.35em] uppercase text-gold mb-4">Notebook</p>
            <h1 className="font-serif text-[clamp(2.8rem,7vw,6rem)] font-light text-cream leading-tight">
              Real stories.<br />Not LinkedIn posts.
            </h1>
          </div>
        </section>
        <BlogSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
