import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const partners = [
  { name: 'Daster' },
  { name: 'Sepatu Thrifting' },
  { name: 'Ukuran Jelas' },
  { name: 'Stok Update' },
  { name: 'Harga Ramah' },
  { name: 'Chat WhatsApp' },
];

export default function PartnersSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.partner-logo', {
        y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 lg:py-20 bg-cream section-padding">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="font-display italic text-soil text-2xl lg:text-3xl mb-10">
          Harumi Store melayani
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16">
          {partners.map((partner) => (
            <div
              key={partner.name}
              className="partner-logo font-body font-bold text-lg lg:text-xl text-soil/40 hover:text-soil/70 transition-colors cursor-pointer uppercase tracking-wide"
            >
              {partner.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
