import Header from '../sections/Header';
import HeroSection from '../sections/HeroSection';
import ExclusivesSection from '../sections/ExclusivesSection';
import CircularTextSection from '../sections/CircularTextSection';
import FeaturedProducts from '../sections/FeaturedProducts';
import BundlesSection from '../sections/BundlesSection';
import HappyHouse from '../sections/HappyHouse';
import PartnersSection from '../sections/PartnersSection';
import Footer from '../sections/Footer';
import NewsletterPopup from '../sections/NewsletterPopup';

export default function Home() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main>
        <HeroSection />
        <ExclusivesSection />
        <CircularTextSection />
        <FeaturedProducts />
        <BundlesSection />
        <HappyHouse />
        <PartnersSection />
      </main>
      <Footer />
      <NewsletterPopup />
    </div>
  );
}
