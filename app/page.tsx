import Navbar from "@/app/components/Navbar";
import ProgressBar from "@/app/components/ProgressBar";
import BackToTop from "@/app/components/BackToTop";
import AudioPlayer from "@/app/components/AudioPlayer";
import Footer from "@/app/components/Footer";
import HeroSection from "@/app/sections/HeroSection";
import AboutSection from "@/app/sections/AboutSection";
import ExperienceSection from "@/app/sections/ExperienceSection";
import TravelSection from "@/app/sections/TravelSection";
import SportsSection from "@/app/sections/SportsSection";
import BlogSection from "@/app/sections/BlogSection";
import ContactSection from "@/app/sections/ContactSection";

export default function Home() {
  return (
    <>
      <ProgressBar />
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <TravelSection />
        <SportsSection />
        <BlogSection />
        <ContactSection />
      </main>
      <Footer />
      <BackToTop />
      <AudioPlayer />
    </>
  );
}
