import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Heart, Search, SlidersHorizontal } from 'lucide-react'
import { CheckoutDialog } from '@/components/catalog/CheckoutDialog'
import { catalogProductToCheckoutProduct, getProductPriceLabel, getProductTotalStock } from '@/lib/checkout'
import { getActiveProducts, getCategories, type CatalogProduct } from '@/lib/supabase/catalog'
import Header from '@/sections/Header'

type CategoryOption = {
  id: string
  name: string
  slug: string
}

const fallbackImages = [
  '/images/products/chocolate-cashew.png',
  '/images/products/tongue-scraper.png',
  '/images/products/olive-oil.png',
  '/images/products/peppermint-mints.png',
  '/images/products/nutbutter-chocolate.png',
  '/images/products/chips-seasalt.png',
]

export default function CatalogPage() {
  const [categorySlug, setCategorySlug] = useState('all')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [query, setQuery] = useState('')
  const [stockStatus, setStockStatus] = useState('all')

  useEffect(() => {
    Promise.all([
      getCategories(),
      getActiveProducts({ includeOutOfStock: true }),
    ])
      .then(([categoryRows, productRows]) => {
        setCategories(categoryRows)
        setProducts(productRows)
      })
      .catch(() => {
        setCategories([])
        setProducts([])
      })
      .finally(() => setIsLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const checkoutProduct = catalogProductToCheckoutProduct(product, '')
      const totalStock = getProductTotalStock(checkoutProduct)
      const queryText = query.trim().toLowerCase()
      const matchesQuery = !queryText
        || product.name.toLowerCase().includes(queryText)
        || product.description.toLowerCase().includes(queryText)
        || (product.category?.name ?? '').toLowerCase().includes(queryText)
      const matchesCategory = categorySlug === 'all' || product.category?.slug === categorySlug
      const matchesStock = stockStatus === 'all'
        || (stockStatus === 'ready' && totalStock > 0)
        || (stockStatus === 'po' && totalStock === 0)

      return matchesQuery && matchesCategory && matchesStock
    })
  }, [categorySlug, products, query, stockStatus])

  return (
    <div className="min-h-screen bg-cream text-soil">
      <Header solidAtTop />

      <main className="section-padding pb-20 pt-28 lg:pt-32">
        <section className="mx-auto max-w-7xl">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 font-body text-xs font-bold uppercase tracking-widest text-rose hover:text-soil">
            <ArrowLeft size={15} />
            Kembali
          </Link>

          <div>
            <div>
              <p className="font-body text-xs font-extrabold uppercase tracking-[0.22em] text-rose">
                Harumi Store
              </p>
              <h1 className="mt-3 font-body text-4xl font-extrabold uppercase leading-none tracking-wide text-soil sm:text-5xl lg:text-6xl">
                Semua<br />Produk
              </h1>
            </div>
          </div>

          <section className="mt-8 rounded-lg border border-rose/10 bg-white p-4 shadow-card">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-moss" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari produk, kategori, deskripsi..."
                  className="h-12 w-full rounded-lg border border-rose/15 bg-white pl-11 pr-4 font-body text-sm outline-none transition-colors placeholder:text-moss/55 focus:border-rose"
                />
              </label>

              <label className="relative">
                <SlidersHorizontal className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-moss" />
                <select
                  value={categorySlug}
                  onChange={(event) => setCategorySlug(event.target.value)}
                  className="h-12 w-full appearance-none rounded-lg border border-rose/15 bg-white pl-11 pr-4 font-body text-sm outline-none transition-colors focus:border-rose"
                >
                  <option value="all">Semua kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </label>

              <select
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
                className="h-12 rounded-lg border border-rose/15 bg-white px-4 font-body text-sm outline-none transition-colors focus:border-rose"
              >
                <option value="all">Semua stok</option>
                <option value="ready">Ready stock</option>
                <option value="po">Bisa PO</option>
              </select>
            </div>
          </section>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">
              {isLoading ? 'Memuat produk' : `${filteredProducts.length} produk tampil`}
            </p>
          </div>

          {isLoading && (
            <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-80 rounded-2xl bg-white/70" />
              ))}
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="mt-6 rounded-2xl border border-rose/10 bg-white p-10 text-center font-body text-sm text-moss">
              Produk tidak ditemukan. Coba ubah kata kunci atau filter katalog.
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {filteredProducts.map((catalogProduct, index) => {
                const product = catalogProductToCheckoutProduct(catalogProduct, fallbackImages[index % fallbackImages.length])
                const totalStock = getProductTotalStock(product)

                return (
                  <article key={product.id} className="product-card">
                    <div className="relative flex h-52 items-center justify-center bg-[#f0ede8] p-4 lg:h-64 lg:p-6">
                      <span className={[
                        'absolute left-3 top-3 rounded-full px-3 py-1 font-body text-[9px] font-bold uppercase tracking-widest',
                        totalStock > 0 ? 'bg-moss/15 text-soil' : 'bg-rose text-cream',
                      ].join(' ')}>
                        {totalStock > 0 ? `${totalStock} stok` : 'PO'}
                      </span>
                      <button className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/85 text-soil transition-all hover:bg-white" aria-label="Simpan produk">
                        <Heart size={14} strokeWidth={1.5} />
                      </button>
                      <Link to={`/products/${catalogProduct.slug}`} className="flex h-full w-full items-center justify-center" aria-label={`Lihat detail ${product.name}`}>
                        <img src={product.image} alt={product.name} className="max-h-36 w-auto object-contain transition-transform duration-300 hover:scale-105 lg:max-h-48" />
                      </Link>
                    </div>
                    <div className="p-4 lg:p-5">
                      <p className="font-body text-[9px] font-bold uppercase tracking-widest text-moss">
                        {product.vendor}
                      </p>
                      <h2 className="mt-2 min-h-10 font-body text-sm font-extrabold leading-snug text-soil">
                        <Link to={`/products/${catalogProduct.slug}`} className="hover:text-rose">
                          {product.name}
                        </Link>
                      </h2>
                      <p className="mt-2 font-body text-xs font-bold text-soil">
                        {getProductPriceLabel(product)}
                      </p>
                      <CheckoutDialog
                        product={product}
                        source="catalog_page"
                        buttonClassName="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-rose py-2.5 font-body text-[10px] font-bold uppercase tracking-widest text-rose transition-all duration-300 hover:bg-rose hover:text-cream"
                      />
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
