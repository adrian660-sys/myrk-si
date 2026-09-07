import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import Footer from "@/app/components/Footer";
import HeroSection from "@/app/sections/HeroSection";
import AboutSection from "@/app/sections/AboutSection";
import LetsTalkSection from "@/app/sections/LetsTalkSection";

export default function Home() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <HeroSection />
        {/* Dark → Light bridge */}
        <div aria-hidden="true" className="h-16 bg-gradient-to-b from-[#080808] to-[#f9f6f0]" />
        <AboutSection />
        {/* Light → Dark bridge */}
        <div aria-hidden="true" className="h-16 bg-gradient-to-b from-[#f9f6f0] to-[#080808]" />
        <LetsTalkSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
