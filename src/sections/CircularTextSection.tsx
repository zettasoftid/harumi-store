import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const backgroundImages = [
  { src: '/baju2.mp4', poster: '/baju2-poster.webp' },
  { src: '/sepatu3.mp4', poster: '/sepatu3-poster.webp' },
];

export default function CircularTextSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLSpanElement[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % backgroundImages.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      linesRef.current.forEach((line, i) => {
        if (!line) return;
        const fromX = i % 2 === 0 ? -200 : 200;
        gsap.from(line, {
          opacity: 0,
          rotationX: -90,
          z: -200,
          x: fromX,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: 'top 60%',
            end: 'bottom 80%',
            scrub: true,
          },
        });
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const texts = ['CANTIK', 'RAMAH', 'TEPERCAYA'];

  return (
    <section
      ref={wrapperRef}
      className="relative bg-soil flex items-center justify-center section-padding overflow-hidden"
      style={{ height: '100vh', minHeight: '560px' }}
    >
      <div className="absolute inset-0">
        <video
          key={backgroundImages[activeImage].src}
          src={backgroundImages[activeImage].src}
          poster={backgroundImages[activeImage].poster}
          aria-label="Video background Harumi Store"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover brightness-[0.82]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-soil/65 via-soil/35 to-rose/20" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center overflow-hidden">
        <h2
          className="font-caudex text-cream text-center uppercase drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
          style={{
            fontSize: 'clamp(2.8rem, 8vw, 7rem)',
            fontWeight: 400,
            letterSpacing: '0',
            lineHeight: 1.12,
          }}
        >
          {texts.map((text, i) => (
            <span
              key={i}
              className="block perspective-1000"
              style={{ perspectiveOrigin: i % 2 === 0 ? '150% 50%' : '-50% 50%' }}
            >
              <span
                ref={(el) => { if (el) linesRef.current[i] = el; }}
                className="block preserve-3d"
                style={{ transformOrigin: '50% 50%' }}
              >
                {text}
              </span>
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
