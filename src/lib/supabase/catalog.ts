import { supabase } from './client'
import type { Inserts, Tables } from './database.types'
import { isLocalBackendEnabled, localApi } from './local-api'
import { getProductImageUrl } from './storage'

type CategoryRow = Tables<'categories'>
type ProductRow = Tables<'products'>
type ProductImageRow = Tables<'product_images'>
type ProductVariantRow = Tables<'product_variants'>

type ProductWithRelations = ProductRow & {
  categories: CategoryRow | null
  product_images: ProductImageRow[] | null
  product_variants: ProductVariantRow[] | null
}

export type CatalogVariant = ProductVariantRow

export type CatalogProduct = ProductRow & {
  category: CategoryRow | null
  images: Array<ProductImageRow & { public_url: string | null }>
  variants: ProductVariantRow[]
  primary_image_url: string | null
  min_price: number
  max_price: number
  total_stock: number
  is_available: boolean
}

export type CatalogFilters = {
  categorySlug?: string
  includeOutOfStock?: boolean
  search?: string
  size?: string
}

function mapProduct(product: ProductWithRelations): CatalogProduct {
  const images = [...(product.product_images ?? [])]
    .sort((first, second) => Number(second.is_primary) - Number(first.is_primary) || first.sort_order - second.sort_order)
    .map((image) => ({
      ...image,
      public_url: getProductImageUrl(image.image_path),
    }))

  const variants = [...(product.product_variants ?? [])]
    .filter((variant) => variant.is_active)
    .sort((first, second) => first.size.localeCompare(second.size))

  const prices = variants.map((variant) => variant.selling_price)
  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0)

  return {
    ...product,
    category: product.categories,
    images,
    variants,
    primary_image_url: images[0]?.public_url ?? null,
    min_price: prices.length > 0 ? Math.min(...prices) : 0,
    max_price: prices.length > 0 ? Math.max(...prices) : 0,
    total_stock: totalStock,
    is_available: totalStock > 0,
  }
}

function matchesFilters(product: CatalogProduct, filters: CatalogFilters) {
  if (filters.categorySlug && product.category?.slug !== filters.categorySlug) return false
  if (filters.size && !product.variants.some((variant) => variant.size.toLowerCase() === filters.size?.toLowerCase())) return false
  if (!filters.includeOutOfStock && !product.is_available) return false

  if (filters.search) {
    const query = filters.search.toLowerCase()
    const haystack = [product.name, product.description, product.condition_note, product.category?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  }

  return true
}

export async function getCategories() {
  if (isLocalBackendEnabled()) {
    return localApi<CategoryRow[]>('/categories')
  }

  const { data, error } = await supabase.from('categories').select('*').order('name')

  if (error) throw error
  return data
}

export async function getActiveProducts(filters: CatalogFilters = {}) {
  if (isLocalBackendEnabled()) {
    const data = await localApi<ProductWithRelations[]>('/products')

    return data
      .filter((product) => product.is_active)
      .map(mapProduct)
      .filter((product) => matchesFilters(product, filters))
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*),
      product_images (*),
      product_variants (*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as ProductWithRelations[])
    .map(mapProduct)
    .filter((product) => matchesFilters(product, filters))
}

export async function getProductBySlug(slug: string) {
  if (isLocalBackendEnabled()) {
    const data = await localApi<ProductWithRelations[]>('/products')
    const product = data.find((row) => row.slug === slug && row.is_active)

    return product ? mapProduct(product) : null
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (*),
      product_images (*),
      product_variants (*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data ? mapProduct(data as ProductWithRelations) : null
}

export async function recordWhatsAppClick(input: Omit<Inserts<'wa_click_events'>, 'referrer'> & { referrer?: string | null }) {
  const payload = {
    ...input,
    referrer: input.referrer ?? (typeof document === 'undefined' ? null : document.referrer),
  }

  if (isLocalBackendEnabled()) {
    await localApi<unknown>('/wa-click-events', {
      body: JSON.stringify(payload),
      method: 'POST',
    })
    return
  }

  const { error } = await supabase.from('wa_click_events').insert({
    ...payload,
  })

  if (error) throw error
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount)
}

export function buildWhatsAppProductUrl(params: {
  adminWhatsapp: string
  address?: string
  customerName?: string
  customerPhone?: string
  product: CatalogProduct
  productUrl?: string
  quantity?: number
  variant?: CatalogVariant | null
}) {
  const phone = params.adminWhatsapp.replace(/[^\d]/g, '')
  const variant = params.variant ?? params.product.variants[0] ?? null
  const price = variant?.selling_price ?? params.product.min_price
  const quantity = Math.max(params.quantity ?? 1, 1)
  const orderStatus = (variant?.stock ?? params.product.total_stock) > 0 ? 'Ready stock' : 'PO'
  const productUrl = params.productUrl ?? (typeof window === 'undefined' ? '' : window.location.href)
  const message = [
    'Halo Admin Harumi Store, saya mau checkout:',
    '',
    `Produk: ${params.product.name}`,
    `Kategori: ${params.product.category?.name ?? '-'}`,
    `Size: ${variant?.size ?? '-'}`,
    `Warna: ${variant?.color ?? '-'}`,
    `Qty: ${quantity}`,
    `Status: ${orderStatus}`,
    `Harga: ${formatRupiah(price)}`,
    `Subtotal: ${formatRupiah(price * quantity)}`,
    `SKU: ${variant?.sku ?? '-'}`,
    '',
    `Nama: ${params.customerName || '-'}`,
    `No. HP: ${params.customerPhone || '-'}`,
    `Alamat/Catatan: ${params.address || '-'}`,
    '',
    `Link: ${productUrl}`,
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
