import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Heart, ArrowRight } from 'lucide-react';
import { CheckoutDialog } from '@/components/catalog/CheckoutDialog';
import { catalogProductToCheckoutProduct, getProductPriceLabel } from '@/lib/checkout';
import { getActiveProducts, type CatalogProduct } from '@/lib/supabase/catalog';

gsap.registerPlugin(ScrollTrigger);

const fallbackImages = [
  '/images/products/nutbutter-chocolate.png',
  '/images/products/chips-seasalt.png',
  '/images/products/pasta-lentil.png',
  '/images/products/tahini-raw.png',
];

export default function ExclusivesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    getActiveProducts({ includeOutOfStock: true })
      .then((rows) => setProducts(rows.slice(0, 6)))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
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
              <h2 className="font-display text-4xl font-extrabold uppercase tracking-wide text-soil lg:text-5xl" style={{ letterSpacing: '0' }}>
                Katalog<br />Terbaru
              </h2>
              <p className="font-body text-moss mt-4 text-sm leading-relaxed">
                Barang pilihan Harumi Store dengan stok sederhana, ukuran jelas, dan siap checkout.
              </p>
              <a href="/products" className="btn-pill-dark mt-6 inline-flex">
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
              {isLoading && Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-[38rem] w-64 flex-shrink-0 rounded-2xl bg-white/70 sm:w-72" />
              ))}

              {!isLoading && products.length === 0 && (
                <div className="min-h-72 flex-1 rounded-2xl border border-rose/10 bg-white p-8 font-body text-sm leading-relaxed text-moss">
                  Belum ada produk aktif di database. Tambahkan produk dari dashboard admin agar katalog terbaru terisi otomatis.
                </div>
              )}

              {!isLoading && products.map((catalogProduct, index) => {
                const product = catalogProductToCheckoutProduct(catalogProduct, fallbackImages[index % fallbackImages.length]);

                return (
                  <div
                    key={product.id}
                  className="exclusives-card flex-shrink-0 w-64 sm:w-72"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="product-card">
                    {/* Image area */}
                    <div className="relative bg-[#f0ede8] p-6 flex items-center justify-center h-72">
                      {index < 2 && (
                        <span className="absolute top-4 left-4 bg-moss/15 text-soil font-body font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">
                          Favorit
                        </span>
                      )}
                      <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-soil hover:bg-white transition-all" aria-label="Simpan produk">
                        <Heart size={14} strokeWidth={1.5} />
                      </button>
                      <Link to={`/products/${catalogProduct.slug}`} className="flex h-full w-full items-center justify-center" aria-label={`Lihat detail ${product.name}`}>
                        <img src={product.image} alt={product.name} className="max-h-48 w-auto object-contain transition-transform duration-300 hover:scale-105" />
                      </Link>
                    </div>
                    {/* Info */}
                    <div className="p-5">
                      <p className="font-body font-bold text-[10px] uppercase tracking-widest text-moss">
                        Kategori: {product.vendor}
                      </p>
                      <h3 className="font-body font-bold text-sm text-soil mt-2 leading-snug line-clamp-2">
                        <Link to={`/products/${catalogProduct.slug}`} className="hover:text-rose">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="font-body text-sm text-soil mt-2">
                        Harga<br />
                        <span className="font-bold">{getProductPriceLabel(product)}</span>
                      </p>
                      <CheckoutDialog
                        product={product}
                        source="exclusive_products"
                        buttonClassName="w-full mt-4 py-2.5 rounded-full border-2 border-rose text-rose font-body font-bold text-[11px] uppercase tracking-widest hover:bg-rose hover:text-cream transition-all duration-300 inline-flex items-center justify-center gap-2"
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
