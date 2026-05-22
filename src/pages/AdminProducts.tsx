import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { Archive, Edit3, Eye, PackagePlus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { archiveProduct, deleteProduct, getAdminProducts, setProductActive } from '@/lib/supabase'
import { quietlySyncCurrentDataToGoogleSheets } from '@/lib/google-sheets'
import { useAdminAccess } from '@/hooks/use-admin-access'

type ProductImage = {
  image_path: string
  is_primary: boolean
}

type ProductVariant = {
  selling_price: number
  size: string
  stock: number
}

type ProductCategory = {
  name: string
  slug: string
}

type AdminProductRow = {
  categories: ProductCategory | null
  id: string
  is_active: boolean
  name: string
  product_images: ProductImage[] | null
  product_variants: ProductVariant[] | null
  slug: string
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

function minPrice(product: AdminProductRow) {
  const prices = (product.product_variants ?? []).map((variant) => variant.selling_price)
  return prices.length > 0 ? Math.min(...prices) : 0
}

function totalStock(product: AdminProductRow) {
  return (product.product_variants ?? []).reduce((sum, variant) => sum + variant.stock, 0)
}

function sizes(product: AdminProductRow) {
  return (product.product_variants ?? []).map((variant) => variant.size).join(', ') || '-'
}

export default function AdminProducts() {
  const { isAllowed, isLoading, testBypass } = useAdminAccess()
  const [products, setProducts] = useState<AdminProductRow[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState('all')

  const refreshProducts = useCallback(async () => {
    try {
      setLoadError('')
      const data = await getAdminProducts()
      setProducts((data ?? []) as AdminProductRow[])
    } catch (error) {
      setProducts([])
      setLoadError(error instanceof Error ? error.message : 'Gagal memuat produk.')
    }
  }, [])

  useEffect(() => {
    if (!isAllowed) return

    getAdminProducts()
      .then((data) => {
        setLoadError('')
        setProducts((data ?? []) as AdminProductRow[])
      })
      .catch((error) => {
        setProducts([])
        setLoadError(error instanceof Error ? error.message : 'Gagal memuat produk.')
      })
  }, [isAllowed])

  async function handleToggleActive(product: AdminProductRow) {
    if (product.id.startsWith('sample-')) return

    try {
      if (product.is_active) {
        await archiveProduct(product.id)
      } else {
        await setProductActive(product.id, true)
      }
      await refreshProducts()
      void quietlySyncCurrentDataToGoogleSheets().catch(() => undefined)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal mengubah status produk.')
    }
  }

  async function handleDelete(product: AdminProductRow) {
    if (product.id.startsWith('sample-')) return
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return

    try {
      await deleteProduct(product.id)
      await refreshProducts()
      void quietlySyncCurrentDataToGoogleSheets().catch(() => undefined)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menghapus produk.')
    }
  }

  const categories = useMemo(() => {
    const names = products.map((product) => product.categories?.name).filter(Boolean) as string[]
    return Array.from(new Set(names))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = category === 'all' || product.categories?.name === category
      const stock = totalStock(product)
      const matchesStatus =
        status === 'all'
        || (status === 'active' && product.is_active)
        || (status === 'archived' && !product.is_active)
        || (status === 'out' && stock === 0)

      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [category, products, query, status])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">
        Memuat katalog...
      </main>
    )
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  const activeCount = products.filter((product) => product.is_active).length
  const outOfStockCount = products.filter((product) => totalStock(product) === 0).length

  return (
    <AdminLayout
      title="Katalog Produk"
      description="Kelola produk, kategori, size, stok sederhana, HPP, harga jual, dan status tampil katalog."
      testBypass={testBypass}
      action={
        <Button asChild className="rounded-lg bg-rose text-cream hover:bg-rose/90">
          <Link to="/admin/products/new">
            <PackagePlus />
            Tambah Produk
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">Total produk</p>
          <p className="mt-2 font-body text-3xl font-extrabold">{products.length}</p>
        </article>
        <article className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">Produk aktif</p>
          <p className="mt-2 font-body text-3xl font-extrabold">{activeCount}</p>
        </article>
        <article className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">Stok habis</p>
          <p className="mt-2 font-body text-3xl font-extrabold">{outOfStockCount}</p>
        </article>
      </div>

      <section className="mt-5 rounded-lg border border-rose/10 bg-white shadow-card">
        <div className="grid gap-3 border-b border-rose/10 p-4 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama produk..."
              className="h-11 rounded-lg border-rose/15 pl-10 focus-visible:border-rose"
            />
          </div>

          <label className="relative">
            <SlidersHorizontal className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-moss" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full appearance-none rounded-lg border border-rose/15 bg-white pl-10 pr-3 font-body text-sm text-soil outline-none focus:border-rose"
            >
              <option value="all">Semua kategori</option>
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-lg border border-rose/15 bg-white px-3 font-body text-sm text-soil outline-none focus:border-rose"
          >
            <option value="all">Semua status</option>
            <option value="active">Aktif</option>
            <option value="archived">Nonaktif</option>
            <option value="out">Stok habis</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loadError && (
            <div className="border-b border-rose/10 bg-rose/5 p-4 font-body text-sm leading-relaxed text-rose">
              Gagal memuat produk: {loadError}. Jika memakai mode lokal, jalankan <span className="font-bold">npm run dev</span> agar API lokal ikut aktif.
            </div>
          )}
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-rose/10 bg-cream/60 font-body text-xs uppercase tracking-widest text-moss">
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">Harga mulai</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const stock = totalStock(product)

                return (
                  <tr key={product.id} className="border-b border-rose/10 font-body text-sm last:border-0">
                    <td className="px-4 py-4">
                      <div className="font-extrabold text-soil">{product.name}</div>
                      <div className="mt-1 text-xs text-moss">/{product.slug}</div>
                    </td>
                    <td className="px-4 py-4 text-soil">{product.categories?.name ?? '-'}</td>
                    <td className="px-4 py-4 text-soil">{sizes(product)}</td>
                    <td className="px-4 py-4">
                      <span className={stock === 0 ? 'font-bold text-rose' : 'font-bold text-soil'}>{stock}</span>
                    </td>
                    <td className="px-4 py-4 font-bold text-soil">{rupiah(minPrice(product))}</td>
                    <td className="px-4 py-4">
                      <span className={[
                        'inline-flex rounded-full px-3 py-1 font-body text-xs font-bold',
                        product.is_active ? 'bg-moss/15 text-soil' : 'bg-rose/10 text-rose',
                      ].join(' ')}>
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="icon-sm" className="border-rose/20 text-rose hover:bg-clay/20" aria-label="Lihat produk">
                          <Link to={`/products/${product.slug}`}>
                          <Eye />
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="icon-sm" className="border-rose/20 text-rose hover:bg-clay/20" aria-label="Edit produk">
                          <Link to={`/admin/products/${product.id}/edit`}>
                          <Edit3 />
                          </Link>
                        </Button>
                        <Button variant="outline" size="icon-sm" className="border-rose/20 text-rose hover:bg-clay/20" aria-label="Arsip produk" onClick={() => handleToggleActive(product)}>
                          <Archive />
                        </Button>
                        <Button variant="outline" size="icon-sm" className="border-rose/20 text-rose hover:bg-clay/20" aria-label="Hapus produk" onClick={() => handleDelete(product)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
