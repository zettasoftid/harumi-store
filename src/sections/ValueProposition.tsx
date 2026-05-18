import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, MessageCircle, PackageCheck, Sparkles } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: PackageCheck, title: 'Stok Jelas', desc: 'Ukuran, harga, dan status barang mudah dicek' },
  { icon: MessageCircle, title: 'Pesan via WhatsApp', desc: 'Klik produk lalu lanjut chat admin tanpa checkout rumit' },
  { icon: Heart, title: 'Dipilih Personal', desc: 'Katalog dirapikan untuk pembeli teman ke teman' },
  { icon: Sparkles, title: 'Cantik & Praktis', desc: 'Barang harian yang ramah, sederhana, dan terpercaya' },
];

export default function ValueProposition() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.vp-feature', {
        y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-cream section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Heading column */}
          <div className="vp-feature">
            <h2 className="font-display text-soil text-3xl lg:text-4xl" style={{ letterSpacing: '0' }}>
              Standar <em className="italic">Harumi</em><br />Store
            </h2>
            <p className="font-body text-moss mt-3 text-sm leading-relaxed">
              Indah seperti sakura, tetap rapi dalam pengelolaan stok
            </p>
          </div>

          {/* Feature columns */}
          {features.map((f, i) => (
            <div key={i} className="vp-feature text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-soil/15 mb-4">
                <f.icon size={22} strokeWidth={1} className="text-soil" />
              </div>
              <h3 className="font-body font-bold text-soil text-sm uppercase tracking-wide">
                {f.title}
              </h3>
              <p className="font-body text-moss text-sm mt-2 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
