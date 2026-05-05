import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import AudioPlayer from "@/app/components/AudioPlayer";
import Footer from "@/app/components/Footer";
import ScrollSnap from "@/app/components/ScrollSnap";
import HeroSection from "@/app/sections/HeroSection";
import AboutSection from "@/app/sections/AboutSection";
import SportsSection from "@/app/sections/SportsSection";
import ContactSection from "@/app/sections/ContactSection";

export default function Home() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <SportsSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <AudioPlayer />
      <ScrollSnap />
    </>
  );
}
