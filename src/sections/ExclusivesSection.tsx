import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const exclusivesProducts = [
  { id: 1, name: 'Daster Sakura Rayon', vendor: 'DASTER', price: 'Rp65.000', image: '/images/products/nutbutter-chocolate.png', bestSeller: true },
  { id: 2, name: 'Daster Rumah Motif Bunga', vendor: 'DASTER', price: 'Rp58.000', image: '/images/products/chips-seasalt.png', bestSeller: true },
  { id: 3, name: 'Sepatu Thrifting Casual Cream', vendor: 'SEPATU THRIFTING', price: 'Rp95.000', image: '/images/products/nutbutter-chocolate.png', bestSeller: false },
  { id: 4, name: 'Daster Busui Soft Pink', vendor: 'DASTER', price: 'Rp72.000', image: '/images/products/pasta-lentil.png', bestSeller: false },
  { id: 5, name: 'Sepatu Slip On Hitam', vendor: 'SEPATU THRIFTING', price: 'Rp88.000', image: '/images/products/tahini-raw.png', bestSeller: false },
  { id: 6, name: 'Daster Adem Harian', vendor: 'DASTER', price: 'Rp55.000', image: '/images/products/ghee-organic.png', bestSeller: false },
];

export default function ExclusivesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.exclusives-left', {
        x: -50, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%' }
      });
      gsap.from('.exclusives-card', {
        y: 60, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: carouselRef.current, start: 'top 80%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 320;
    carouselRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-cream overflow-hidden">
      <div className="section-padding">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
            {/* Left sticky content */}
            <div className="exclusives-left lg:w-72 flex-shrink-0 lg:sticky lg:top-32 lg:self-start">
              <h2 className="font-display italic text-soil text-4xl lg:text-5xl" style={{ letterSpacing: '0' }}>
                Katalog<br />Terbaru
              </h2>
              <p className="font-body text-moss mt-4 text-sm leading-relaxed">
                Barang pilihan Harumi Store dengan stok sederhana, ukuran jelas, dan siap chat admin.
              </p>
              <a href="#" className="btn-pill-dark mt-6 inline-flex">
                Lihat katalog
                <ArrowRight size={14} className="ml-2" />
              </a>
              <div className="flex gap-3 mt-8">
                  <button onClick={() => scroll('left')} className="w-10 h-10 rounded-full border border-rose/20 flex items-center justify-center text-rose hover:bg-rose hover:text-cream transition-all" aria-label="Sebelumnya">
                  <span className="text-lg">&#8592;</span>
                </button>
                  <button onClick={() => scroll('right')} className="w-10 h-10 rounded-full border border-rose/20 flex items-center justify-center text-rose hover:bg-rose hover:text-cream transition-all" aria-label="Berikutnya">
                  <span className="text-lg">&#8594;</span>
                </button>
              </div>
            </div>

            {/* Product carousel */}
            <div
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto scroll-hidden pb-4 flex-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {exclusivesProducts.map((product) => (
                <div
                  key={product.id}
                  className="exclusives-card flex-shrink-0 w-64 sm:w-72"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="product-card">
                    {/* Image area */}
                    <div className="relative bg-[#f0ede8] p-6 flex items-center justify-center h-72">
                      {product.bestSeller && (
                        <span className="absolute top-4 left-4 bg-moss/15 text-soil font-body font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                          Favorit
                        </span>
                      )}
                      <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-soil hover:bg-white transition-all" aria-label="Simpan produk">
                        <Heart size={14} strokeWidth={1.5} />
                      </button>
                      <img src={product.image} alt={product.name} className="max-h-48 w-auto object-contain" />
                    </div>
                    {/* Info */}
                    <div className="p-5">
                      <p className="font-body font-bold text-[10px] uppercase tracking-widest text-moss">
                        Kategori: {product.vendor}
                      </p>
                      <h3 className="font-body font-bold text-sm text-soil mt-2 leading-snug line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="font-body text-sm text-soil mt-2">
                        Harga<br />
                        <span className="font-bold">{product.price}</span>
                      </p>
                      <button className="w-full mt-4 py-2.5 rounded-full border-2 border-rose text-rose font-body font-bold text-[11px] uppercase tracking-widest hover:bg-rose hover:text-cream transition-all duration-300">
                        Chat Admin
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
