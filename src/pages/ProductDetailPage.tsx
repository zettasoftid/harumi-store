import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2, Images, PackageCheck, Ruler, ShoppingBag } from 'lucide-react'

import { CheckoutDialog } from '@/components/catalog/CheckoutDialog'
import {
  catalogProductToCheckoutProduct,
  formatRupiah,
  getProductPriceLabel,
  getProductTotalStock,
} from '@/lib/checkout'
import { getProductBySlug, type CatalogProduct } from '@/lib/supabase/catalog'
import { cn } from '@/lib/utils'
import Header from '@/sections/Header'

const fallbackImage = '/images/products/chocolate-cashew.webp'

function variantLabel(size: string, color: string | null) {
  return [size, color].filter(Boolean).join(' / ')
}

export default function ProductDetailPage() {
  const { slug = '' } = useParams()
  const [activeImage, setActiveImage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<CatalogProduct | null>(null)

  useEffect(() => {
    let isActive = true

    getProductBySlug(slug)
      .then((row) => {
        if (!isActive) return
        setProduct(row)
        setActiveImage(row?.images[0]?.public_url ?? row?.primary_image_url ?? fallbackImage)
      })
      .catch(() => {
        if (!isActive) return
        setProduct(null)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [slug])

  const checkoutProduct = useMemo(() => {
    if (!product) return null
    return catalogProductToCheckoutProduct(product, fallbackImage)
  }, [product])

  const galleryImages = useMemo(() => {
    if (!product) return []
    const urls = product.images.map((image) => image.public_url).filter(Boolean) as string[]
    return urls.length > 0 ? urls : [fallbackImage]
  }, [product])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream text-soil">
        <Header solidAtTop />
        <main className="section-padding flex min-h-screen items-center justify-center pt-28">
          <p className="font-body text-sm font-bold uppercase tracking-widest text-moss">Memuat detail produk...</p>
        </main>
      </div>
    )
  }

  if (!product || !checkoutProduct) {
    return (
      <div className="min-h-screen bg-cream text-soil">
        <Header solidAtTop />
        <main className="section-padding flex min-h-screen items-center justify-center pt-28">
          <div className="max-w-md text-center">
            <p className="font-body text-xs font-extrabold uppercase tracking-[0.22em] text-rose">Produk tidak ditemukan</p>
            <h1 className="mt-3 font-body text-3xl font-extrabold uppercase leading-tight text-soil">
              Produk ini belum tersedia
            </h1>
            <Link to="/products" className="btn-pill-dark mt-6 inline-flex">
              <ArrowLeft size={14} />
              Kembali ke produk
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const totalStock = getProductTotalStock(checkoutProduct)
  const readyVariants = product.variants.filter((variant) => variant.stock > 0)
  const poVariants = product.variants.filter((variant) => variant.stock <= 0)

  return (
    <div className="min-h-screen bg-cream text-soil">
      <Header solidAtTop />

      <main className="section-padding pb-20 pt-28 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <Link to="/products" className="mb-8 inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-widest text-rose hover:text-soil">
            <ArrowLeft size={15} />
            Semua produk
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <section>
              <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg bg-[#f0ede8] p-6 sm:min-h-[560px]">
                <span className={cn(
                  'absolute left-4 top-4 rounded-full px-4 py-2 font-body text-[10px] font-extrabold uppercase tracking-widest',
                  totalStock > 0 ? 'bg-moss/15 text-soil' : 'bg-rose text-cream',
                )}>
                  {totalStock > 0 ? `${totalStock} stok ready` : 'Bisa PO'}
                </span>
                <img
                  src={activeImage || checkoutProduct.image}
                  alt={product.name}
                  decoding="async"
                  fetchPriority="high"
                  className="max-h-[30rem] w-auto object-contain"
                />
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    className={cn(
                      'flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-white p-2 transition-all',
                      (activeImage || checkoutProduct.image) === image ? 'border-rose shadow-card' : 'border-rose/10 hover:border-rose/40',
                    )}
                    onClick={() => setActiveImage(image)}
                    aria-label={`Lihat foto produk ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full w-auto object-contain"
                    />
                  </button>
                ))}
              </div>
            </section>

            <section className="lg:pt-4">
              <p className="font-body text-xs font-extrabold uppercase tracking-[0.22em] text-rose">
                {product.category?.name ?? 'Harumi Store'}
              </p>
              <h1 className="mt-3 font-body text-4xl font-extrabold uppercase leading-none tracking-wide text-soil sm:text-5xl lg:text-6xl">
                {product.name}
              </h1>
              <p className="mt-4 font-body text-2xl font-extrabold text-rose">
                {getProductPriceLabel(checkoutProduct)}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-rose/10 bg-white p-4 shadow-card">
                  <PackageCheck className="mb-3 text-rose" size={18} />
                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-moss">Stok</p>
                  <p className="mt-1 font-body text-sm font-extrabold text-soil">{totalStock > 0 ? `${totalStock} ready` : 'PO'}</p>
                </div>
                <div className="rounded-lg border border-rose/10 bg-white p-4 shadow-card">
                  <Ruler className="mb-3 text-rose" size={18} />
                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-moss">Varian</p>
                  <p className="mt-1 font-body text-sm font-extrabold text-soil">{product.variants.length} pilihan</p>
                </div>
                <div className="rounded-lg border border-rose/10 bg-white p-4 shadow-card">
                  <Images className="mb-3 text-rose" size={18} />
                  <p className="font-body text-[10px] font-bold uppercase tracking-widest text-moss">Foto</p>
                  <p className="mt-1 font-body text-sm font-extrabold text-soil">{galleryImages.length} gambar</p>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-rose/10 bg-white p-5 shadow-card">
                <h2 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Deskripsi</h2>
                <p className="mt-3 whitespace-pre-line font-body text-sm leading-relaxed text-moss">
                  {product.description}
                </p>
                {product.condition_note && (
                  <div className="mt-4 rounded-lg bg-cream p-4">
                    <p className="font-body text-xs font-extrabold uppercase tracking-widest text-rose">Catatan kondisi</p>
                    <p className="mt-2 whitespace-pre-line font-body text-sm leading-relaxed text-soil">{product.condition_note}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 rounded-lg border border-rose/10 bg-white p-5 shadow-card">
                <h2 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Pilihan varian</h2>
                <div className="mt-4 grid gap-2">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between gap-3 rounded-lg bg-cream px-4 py-3 font-body text-sm">
                      <div>
                        <p className="font-extrabold text-soil">{variantLabel(variant.size, variant.color)}</p>
                        <p className="text-xs text-moss">{variant.sku ? `SKU ${variant.sku}` : 'SKU belum diisi'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-soil">{formatRupiah(variant.selling_price)}</p>
                        <p className={cn('text-xs font-bold', variant.stock > 0 ? 'text-moss' : 'text-rose')}>
                          {variant.stock > 0 ? `${variant.stock} ready` : 'PO'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-rose/10 bg-white p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 text-rose" size={18} />
                  <div>
                    <p className="font-body text-sm font-extrabold text-soil">Checkout via WhatsApp</p>
                    <p className="mt-1 font-body text-sm leading-relaxed text-moss">
                      Pilih varian di tombol checkout. Jika stok habis, pesanan akan otomatis ditandai PO.
                    </p>
                  </div>
                </div>
                <CheckoutDialog
                  product={checkoutProduct}
                  source="product_detail"
                  buttonClassName="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-rose font-body text-xs font-bold uppercase tracking-widest text-cream transition-all duration-300 hover:bg-rose/90"
                />
              </div>
            </section>
          </div>

          <section className="mt-12 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
              <ShoppingBag className="mb-3 text-rose" size={18} />
              <h2 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Ready stock</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-moss">
                {readyVariants.length > 0
                  ? readyVariants.map((variant) => variantLabel(variant.size, variant.color)).join(', ')
                  : 'Belum ada varian ready. Produk masih bisa dipesan sebagai PO.'}
              </p>
            </div>
            <div className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
              <PackageCheck className="mb-3 text-rose" size={18} />
              <h2 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Pre-order</h2>
              <p className="mt-2 font-body text-sm leading-relaxed text-moss">
                {poVariants.length > 0
                  ? poVariants.map((variant) => variantLabel(variant.size, variant.color)).join(', ')
                  : 'Semua varian yang aktif masih punya stok ready.'}
              </p>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}
