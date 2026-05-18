import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const products = [
  { id: 1, name: 'Daster Sakura Rayon', vendor: 'DASTER', price: 'Rp65.000', image: '/images/products/chocolate-cashew.png' },
  { id: 2, name: 'Daster Rumah Motif Bunga', vendor: 'DASTER', price: 'Rp58.000', image: '/images/products/tongue-scraper.png' },
  { id: 3, name: 'Sepatu Thrifting Casual Cream', vendor: 'SEPATU THRIFTING', price: 'Rp95.000', image: '/images/products/olive-oil.png' },
  { id: 4, name: 'Daster Busui Soft Pink', vendor: 'DASTER', price: 'Rp72.000', image: '/images/products/peppermint-mints.png' },
  { id: 5, name: 'Sepatu Slip On Hitam', vendor: 'SEPATU THRIFTING', price: 'Rp88.000', image: '/images/products/mango-chunks.png' },
  { id: 6, name: 'Daster Adem Harian', vendor: 'DASTER', price: 'Rp55.000', image: '/images/products/cereal-hoops.png' },
];

export default function FeaturedProducts() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.featured-header', {
        y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' }
      });
      gsap.from('.featured-card', {
        y: 50, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.featured-grid', start: 'top 85%' }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-cream section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="featured-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <h2 className="font-display italic text-soil text-4xl lg:text-5xl" style={{ letterSpacing: '0' }}>
              Produk<br />Pilihan
            </h2>
            <p className="font-body text-moss mt-3 text-sm max-w-sm leading-relaxed">
              Pilihan katalog yang mudah discan dan siap ditanyakan ke admin
            </p>
          </div>
          <a href="#" className="btn-pill-clay inline-flex self-start sm:self-auto">
            Lihat semua produk
            <ArrowRight size={14} className="ml-2" />
          </a>
        </div>

        <div className="featured-grid grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {products.map((product) => (
            <div key={product.id} className="featured-card">
              <div className="product-card">
                <div className="relative bg-[#f0ede8] p-4 lg:p-6 flex items-center justify-center h-48 lg:h-60">
                  <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-soil hover:bg-white transition-all" aria-label="Simpan produk">
                    <Heart size={13} strokeWidth={1.5} />
                  </button>
                  <img src={product.image} alt={product.name} className="max-h-36 lg:max-h-44 w-auto object-contain" />
                </div>
                <div className="p-4">
                  <p className="font-body font-bold text-[9px] uppercase tracking-widest text-moss">
                    {product.vendor}
                  </p>
                  <h3 className="font-body font-bold text-xs lg:text-sm text-soil mt-1.5 leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="font-body text-xs text-soil mt-2">
                    {product.price}
                  </p>
                  <button className="w-full mt-3 py-2 rounded-full border-2 border-rose text-rose font-body font-bold text-[10px] uppercase tracking-widest hover:bg-rose hover:text-cream transition-all duration-300">
                    Chat Admin
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
