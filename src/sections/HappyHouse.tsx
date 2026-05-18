import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function HappyHouse() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.happy-content', {
        y: 50, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-10 lg:py-16 bg-cream section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="happy-content relative rounded-2xl overflow-hidden">
          <div className="aspect-[16/7] lg:aspect-[16/5]">
            <img
              src="/images/happy-house.jpg"
              alt="Harumi Store catalog banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-soil/50 via-soil/20 to-transparent" />
          </div>
          <div className="absolute inset-0 flex flex-col justify-center section-padding">
            <h2 className="font-display italic text-white text-3xl lg:text-5xl" style={{ letterSpacing: '0', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Pesan <em>Via WhatsApp</em>
            </h2>
            <p className="font-body text-white/90 text-sm mt-3 max-w-md leading-relaxed" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
              Pilih produk, cek ukuran, lalu chat admin dengan pesan otomatis.
            </p>
            <a href="#" className="inline-flex items-center self-start mt-5 px-6 py-2.5 rounded-full bg-clay text-white font-body font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity">
              Chat sekarang
              <ArrowRight size={14} className="ml-2" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
