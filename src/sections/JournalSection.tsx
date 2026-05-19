import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const articles = [
  {
    title: 'Cara Memilih Daster yang Nyaman Dipakai Harian',
    excerpt: 'Pilih bahan yang adem, potongan yang longgar, dan ukuran yang pas agar tetap nyaman untuk aktivitas rumah maupun kerja ringan.',
    image: '/images/journal/food-labels.jpg',
  },
  {
    title: 'Checklist Kondisi Sepatu Thrifting Sebelum Beli',
    excerpt: 'Perhatikan sol, bagian dalam, noda, dan kenyamanan ukuran agar pembelian sepatu thrifting terasa aman.',
    image: '/images/journal/microplastics.jpg',
  },
  {
    title: 'Kenapa Stok Barang Thrifting Cepat Berubah',
    excerpt: 'Produk thrifting biasanya unik dan jumlahnya terbatas, jadi status stok perlu dicek sebelum transaksi selesai.',
    image: '/images/journal/upf-foods.jpg',
  },
  {
    title: 'Tips Checkout WhatsApp Agar Pesanan Lebih Cepat Diproses',
    excerpt: 'Sertakan nama produk, ukuran, dan alamat awal agar admin bisa mengecek stok dan ongkir dengan cepat.',
    image: '/images/journal/seed-oils.jpg',
  },
];

export default function JournalSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.journal-header', {
        y: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
      gsap.from('.journal-card', {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.journal-grid', start: 'top 85%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-cream section-padding">
      <div className="max-w-7xl mx-auto">
        <h2 className="journal-header mb-12 font-display text-4xl font-extrabold uppercase tracking-wide text-soil lg:text-5xl" style={{ letterSpacing: '0' }}>
          Catatan <em>Harumi</em>
        </h2>

        <div className="journal-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article, i) => (
            <article key={i} className="journal-card group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <h3 className="font-body font-bold text-soil text-sm mt-4 leading-snug line-clamp-2 group-hover:text-clay transition-colors">
                {article.title}
              </h3>
              <p className="font-body text-moss text-xs mt-2 leading-relaxed line-clamp-3">
                {article.excerpt}
              </p>
              <span className="inline-block mt-3 font-body font-bold text-[10px] uppercase tracking-widest text-soil underline underline-offset-4 group-hover:text-clay transition-colors">
                Baca lagi
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
