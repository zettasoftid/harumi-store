import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const heroVideos = ['/baju1.mp4', '/sepatu1.mp4'];

export default function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number>(0);
  const [activeVideo, setActiveVideo] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveVideo((current) => (current + 1) % heroVideos.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline({ delay: 0.3 });
    tl.fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' })
      .fromTo(subtitleRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.7')
      .fromTo(btnRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5');

    // Lens mouse follow
    const handleMouseMove = (e: MouseEvent) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };

    const animate = () => {
      currentRef.current.x += (mouseRef.current.x - currentRef.current.x) * 0.08;
      currentRef.current.y += (mouseRef.current.y - currentRef.current.y) * 0.08;
      
      if (lensRef.current) {
        const x = (currentRef.current.x - 0.5) * 60;
        const y = (currentRef.current.y - 0.5) * 40;
        lensRef.current.style.transform = `translate(${x}px, ${y}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove);
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (section) section.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Background videos */}
      <div className="absolute inset-0">
        {heroVideos.map((video, index) => (
          <video
            key={video}
            src={video}
            aria-label={index === 0 ? 'Video katalog baju Harumi Store' : 'Video katalog sepatu Harumi Store'}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className={[
              'absolute inset-0 h-full w-full object-cover brightness-[0.82] transition-opacity duration-1000',
              activeVideo === index ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-soil/55 via-soil/25 to-rose/15" />
      </div>

      {/* Liquid glass lens */}
      <div
        ref={lensRef}
        className="absolute left-[15%] top-[10%] w-[55%] h-[75%] pointer-events-none transition-none will-change-transform"
        style={{ zIndex: 2 }}
      >
        <div
          className="w-full h-full rounded-[40px]"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
            backdropFilter: 'blur(2px) saturate(140%)',
            WebkitBackdropFilter: 'blur(2px) saturate(140%)',
            boxShadow: `
              inset 0 1px 1px rgba(255,255,255,0.3),
              inset 0 -1px 1px rgba(255,255,255,0.1),
              0 8px 32px rgba(0,0,0,0.15),
              0 0 0 1px rgba(255,255,255,0.1)
            `,
            border: '1.5px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Edge refraction glow */}
          <div
            className="absolute inset-0 rounded-[40px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)',
              mixBlendMode: 'overlay',
            }}
          />
          <div
            className="absolute inset-0 rounded-[40px] pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px rgba(255,255,255,0.05)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center section-padding" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <h1
          ref={titleRef}
          className="font-display italic text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight max-w-xl opacity-0"
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
            href="#"
            className="inline-flex items-center px-8 py-3 rounded-full border-2 border-white/80 text-white font-body font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-soil transition-all duration-300"
          >
            Lihat Katalog
          </a>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-6 right-8 z-10 flex gap-2">
        {heroVideos.map((video, index) => (
          <button
            key={video}
            type="button"
            aria-label={`Tampilkan video ${index + 1}`}
            className={[
              'h-2 rounded-full transition-all',
              activeVideo === index ? 'w-7 bg-white' : 'w-2 bg-white/45',
            ].join(' ')}
            onClick={() => setActiveVideo(index)}
          />
        ))}
      </div>
    </section>
  );
}
