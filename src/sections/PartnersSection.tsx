import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const shoeBrands = ['Nike', 'Adidas', 'Converse', 'Vans', 'New Balance'];
const dasterLines = ['Daster Rayon', 'Daster Sakura', 'Daster Busui', 'Daster Harian'];

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
        <h2 className="mb-10 font-display text-2xl font-extrabold uppercase tracking-wide text-soil lg:text-3xl">
          Merk sepatu & daster
        </h2>
        <div className="space-y-8">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-rose/70">
              Sepatu Thrifting
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-8 lg:gap-14">
              {shoeBrands.map((brand) => (
                <div
                  key={brand}
                  className="partner-logo font-body font-bold text-lg lg:text-xl text-soil/40 hover:text-soil/70 transition-colors cursor-pointer uppercase tracking-wide"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-rose/70">
              Daster
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-8 lg:gap-14">
              {dasterLines.map((line) => (
                <div
                  key={line}
                  className="partner-logo font-body font-bold text-lg lg:text-xl text-soil/40 hover:text-soil/70 transition-colors cursor-pointer uppercase tracking-wide"
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
