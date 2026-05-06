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
        <AboutSection />
        <LetsTalkSection />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
