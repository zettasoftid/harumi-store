import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const heroImages = [
  { src: '/baju1-poster.webp', label: 'Foto katalog baju Harumi Store' },
  { src: '/sepatu1-poster.webp', label: 'Foto katalog sepatu Harumi Store' },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline({ delay: 0.3 });
    tl.fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' })
      .fromTo(subtitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.7')
      .fromTo(btnRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5');
  }, []);

  return (
    <section ref={sectionRef} className="relative h-screen min-h-[640px] w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          key={heroImages[activeImage].src}
          src={heroImages[activeImage].src}
          alt={heroImages[activeImage].label}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover brightness-[0.82] transition-opacity duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-soil/55 via-soil/25 to-rose/15" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center section-padding" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <h1
          ref={titleRef}
          className="font-display text-4xl font-black uppercase leading-none text-white opacity-0 sm:text-5xl lg:text-6xl xl:text-7xl"
          style={{ letterSpacing: '0' }}
        >
          Harumi<br />Store
        </h1>
        <p
          ref={subtitleRef}
          className="font-body text-white/90 text-base sm:text-lg mt-4 max-w-md leading-relaxed opacity-0"
        >
          Katalog daster dan sepatu thrifting yang cantik, sederhana, dan siap dipesan lewat WhatsApp.
        </p>
        <div className="mt-8 opacity-0" ref={btnRef}>
          <a
            href="/products"
            className="inline-flex items-center px-8 py-3 rounded-full border-2 border-white/80 text-white font-body font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-soil transition-all duration-300"
          >
            Lihat Katalog
          </a>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-6 right-8 z-10 flex gap-2">
        {heroImages.map((image, index) => (
          <button
            key={image.src}
            type="button"
            aria-label={`Tampilkan gambar ${index + 1}`}
            className={[
              'h-2 rounded-full transition-all',
              activeImage === index ? 'w-7 bg-white' : 'w-2 bg-white/45',
            ].join(' ')}
            onClick={() => setActiveImage(index)}
          />
        ))}
      </div>
    </section>
  );
}
