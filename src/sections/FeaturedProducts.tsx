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
  '/images/products/chocolate-cashew.png',
  '/images/products/tongue-scraper.png',
  '/images/products/olive-oil.png',
  '/images/products/peppermint-mints.png',
];

export default function FeaturedProducts() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    getActiveProducts({ includeOutOfStock: true })
      .then((rows) => setProducts(rows.slice(0, 8)))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-cream section-padding">
      <div className="max-w-7xl mx-auto">
        <div className="featured-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div>
            <h2 className="font-body text-4xl font-extrabold uppercase leading-none tracking-wide text-soil lg:text-5xl">
              Produk<br />Pilihan
            </h2>
            <p className="font-body text-moss mt-3 text-sm max-w-sm leading-relaxed">
              Pilihan katalog yang mudah discan dan siap checkout lewat WhatsApp
            </p>
          </div>
          <a href="/products" className="btn-pill-clay inline-flex self-start sm:self-auto">
            Lihat semua produk
            <ArrowRight size={14} className="ml-2" />
          </a>
        </div>

        <div className="featured-grid grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-80 rounded-2xl bg-white/70" />
          ))}

          {!isLoading && products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-rose/10 bg-white p-8 text-center font-body text-sm text-moss">
              Belum ada produk aktif di database. Tambahkan produk dari dashboard admin agar katalog tampil di sini.
            </div>
          )}

          {!isLoading && products.map((catalogProduct, index) => {
            const product = catalogProductToCheckoutProduct(catalogProduct, fallbackImages[index % fallbackImages.length]);

            return (
              <div key={product.id} className="featured-card">
              <div className="product-card">
                <div className="relative bg-[#f0ede8] p-4 lg:p-6 flex items-center justify-center h-48 lg:h-60">
                  <button className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center text-soil hover:bg-white transition-all" aria-label="Simpan produk">
                    <Heart size={13} strokeWidth={1.5} />
                  </button>
                  <Link to={`/products/${catalogProduct.slug}`} className="flex h-full w-full items-center justify-center" aria-label={`Lihat detail ${product.name}`}>
                    <img src={product.image} alt={product.name} className="max-h-36 lg:max-h-44 w-auto object-contain transition-transform duration-300 hover:scale-105" />
                  </Link>
                </div>
                <div className="p-4">
                  <p className="font-body font-bold text-[9px] uppercase tracking-widest text-moss">
                    {product.vendor}
                  </p>
                  <h3 className="font-body font-bold text-xs lg:text-sm text-soil mt-1.5 leading-snug line-clamp-2">
                    <Link to={`/products/${catalogProduct.slug}`} className="hover:text-rose">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="font-body text-xs text-soil mt-2">
                    {getProductPriceLabel(product)}
                  </p>
                  <CheckoutDialog
                    product={product}
                    source="featured_products"
                    buttonClassName="w-full mt-3 py-2 rounded-full border-2 border-rose text-rose font-body font-bold text-[10px] uppercase tracking-widest hover:bg-rose hover:text-cream transition-all duration-300 inline-flex items-center justify-center gap-2"
                  />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
