import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const bundles = [
  { title: 'Daster Harian', desc: 'Pilihan daster adem untuk dipakai kerja rumah atau santai', image: '/images/bundles/personally-selected.webp', cta: 'Lihat Daster', href: '/products?category=daster' },
  { title: 'Sepatu Thrifting', desc: 'Sepatu pilihan dengan kondisi yang dijelaskan sebelum checkout', image: '/images/bundles/snack-hacks.webp', cta: 'Lihat Sepatu', href: '/products?category=sepatu-thrifting' },
  { title: 'Pilihan Teman', desc: 'Barang yang cocok dibagikan dari teman ke teman', image: '/images/bundles/little-ones.webp', cta: 'Checkout', href: '/products' },
];

export default function BundlesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.bundles-header', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
      gsap.from('.bundle-card', {
        y: 50, opacity: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: '.bundles-grid', start: 'top 85%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="tentang" ref={sectionRef} className="py-20 lg:py-28 bg-cream section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="bundles-header mb-12">
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-wide text-soil lg:text-5xl" style={{ letterSpacing: '0' }}>
            Kategori <em className="italic">Harumi</em>
          </h2>
          <p className="font-body text-moss mt-3 text-sm">
            Katalog sederhana untuk cepat lihat barang dan langsung checkout
          </p>
        </div>

        <div className="bundles-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          {bundles.map((bundle, i) => (
            <div key={i} className="bundle-card group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={bundle.image}
                    alt={bundle.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
              <h3 className="font-body font-bold text-soil text-lg mt-4">
                {bundle.title}
              </h3>
              <p className="font-body text-moss text-sm mt-1 leading-relaxed">
                {bundle.desc}
              </p>
              <a href={bundle.href} className="inline-block mt-3 font-body font-bold text-xs uppercase tracking-widest text-soil underline underline-offset-4 hover:text-clay transition-colors">
                {bundle.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
