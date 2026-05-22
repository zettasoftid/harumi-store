import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type ShoeBrand = 'nike' | 'adidas' | 'converse' | 'vans' | 'new-balance';

const shoeBrands: ShoeBrand[] = ['nike', 'adidas', 'converse', 'vans', 'new-balance'];
const dasterLines = ['Daster Rayon', 'Daster Sakura', 'Daster Busui', 'Daster Harian'];
const marqueeShoeBrands = [...shoeBrands, ...shoeBrands];
const marqueeDasterLines = [...dasterLines, ...dasterLines];

function ShoeLogo({ brand }: { brand: ShoeBrand }) {
  if (brand === 'nike') {
    return (
      <svg viewBox="0 0 160 54" role="img" aria-label="Nike" className="h-12 w-36">
        <text x="12" y="28" className="fill-current font-display text-[24px] font-black italic tracking-[-1px]">NIKE</text>
        <path
          d="M20 42c28 7 72 1 126-25-35 31-83 43-125 34-16-4-21-13-1-9Z"
          fill="currentColor"
          opacity="0.86"
        />
      </svg>
    );
  }

  if (brand === 'adidas') {
    return (
      <svg viewBox="0 0 176 54" role="img" aria-label="Adidas" className="h-12 w-40">
        <path d="M35 32 48 12h15L50 32H35Zm25 0 16-25h15L75 32H60Zm28 0 19-30h15l-19 30H88Z" fill="currentColor" />
        <text x="32" y="49" className="fill-current font-body text-[20px] font-extrabold tracking-[-1px]">adidas</text>
      </svg>
    );
  }

  if (brand === 'converse') {
    return (
      <svg viewBox="0 0 210 54" role="img" aria-label="Converse" className="h-12 w-48">
        <circle cx="29" cy="26" r="17" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="m29 11 4 10 11 .8-8.5 6.9 2.9 10.8-9.4-5.9-9.4 5.9 2.9-10.8-8.5-6.9 11-.8 4-10Z" fill="currentColor" />
        <text x="58" y="34" className="fill-current font-display text-[25px] font-black tracking-[-1px]">CONVERSE</text>
      </svg>
    );
  }

  if (brand === 'vans') {
    return (
      <svg viewBox="0 0 154 54" role="img" aria-label="Vans" className="h-12 w-36">
        <path d="M22 15h110v27H22z" fill="none" stroke="currentColor" strokeWidth="4" />
        <text x="35" y="36" className="fill-current font-display text-[27px] font-black tracking-[-1px]">VANS</text>
        <path d="M35 15h45v8H35z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 226 54" role="img" aria-label="New Balance" className="h-12 w-52">
      <path d="M18 39 34 14h16l-7 25H30l3-10-7 10H18Zm38 0 7-25h44c10 0 17 4 17 11 0 4-3 8-8 10 4 1 7 4 7 8 0 7-7 11-18 11H56Zm25-15h19c4 0 7-1 7-4s-3-4-7-4H83l-2 8Zm-5 18h21c5 0 8-1 8-4s-3-4-8-4H78l-2 8Z" fill="currentColor" />
      <text x="134" y="23" className="fill-current font-body text-[13px] font-extrabold tracking-[2px]">NEW</text>
      <text x="134" y="40" className="fill-current font-body text-[13px] font-extrabold tracking-[2px]">BALANCE</text>
    </svg>
  );
}

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
        <div className="space-y-12">
          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-rose/70">
              Sepatu Thrifting
            </p>
            <div className="brand-marquee mt-4">
              <div className="brand-marquee-track">
                {marqueeShoeBrands.map((brand, index) => (
                  <div
                    key={`${brand}-${index}`}
                    className="partner-logo brand-logo text-soil/40 transition-colors hover:text-soil/75"
                    aria-hidden={index >= shoeBrands.length}
                  >
                    <ShoeLogo brand={brand} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="font-body text-[10px] font-bold uppercase tracking-[0.18em] text-rose/70">
              Daster
            </p>
            <div className="brand-marquee mt-4">
              <div className="brand-marquee-track brand-marquee-track-slow">
                {marqueeDasterLines.map((line, index) => (
                  <div
                    key={`${line}-${index}`}
                    className="partner-logo min-w-56 text-center font-body text-xl font-extrabold uppercase tracking-wide text-soil/35 transition-colors hover:text-soil/65 lg:text-2xl"
                    aria-hidden={index >= dasterLines.length}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
