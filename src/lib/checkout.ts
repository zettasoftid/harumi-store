import type { CatalogProduct } from './supabase/catalog'

export type CheckoutVariant = {
  color: string
  id: string
  price: number
  size: string
  sku?: string
  stock: number
}

export type CheckoutProduct = {
  bestSeller?: boolean
  id: string
  image: string
  name: string
  variants: CheckoutVariant[]
  vendor: string
}

export type CheckoutMessageInput = {
  address: string
  adminWhatsapp: string
  customerName: string
  customerPhone: string
  product: CheckoutProduct
  productUrl?: string
  quantity: number
  variant: CheckoutVariant
}

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount)
}

export function getProductPriceLabel(product: CheckoutProduct) {
  const prices = product.variants.map((variant) => variant.price)

  if (prices.length === 0) return 'Rp0'

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  return minPrice === maxPrice
    ? formatRupiah(minPrice)
    : `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`
}

export function getProductTotalStock(product: CheckoutProduct) {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0)
}

export function catalogProductToCheckoutProduct(product: CatalogProduct, fallbackImage: string): CheckoutProduct {
  return {
    id: product.id,
    image: product.primary_image_url ?? fallbackImage,
    name: product.name,
    variants: product.variants.map((variant) => ({
      color: variant.color ?? 'Default',
      id: variant.id,
      price: variant.selling_price,
      size: variant.size,
      sku: variant.sku ?? undefined,
      stock: variant.stock,
    })),
    vendor: product.category?.name ?? 'Katalog',
  }
}

export function buildCheckoutWhatsAppUrl(input: CheckoutMessageInput) {
  const phone = input.adminWhatsapp.replace(/[^\d]/g, '')
  const subtotal = input.variant.price * input.quantity
  const orderStatus = input.variant.stock > 0 ? 'Ready stock' : 'PO'
  const productUrl = input.productUrl ?? (typeof window === 'undefined' ? '' : window.location.href)
  const message = [
    'Halo Admin Harumi Store, saya mau checkout:',
    '',
    `Produk: ${input.product.name}`,
    `Kategori: ${input.product.vendor}`,
    `Size: ${input.variant.size}`,
    `Warna: ${input.variant.color}`,
    `Qty: ${input.quantity}`,
    `Status: ${orderStatus}`,
    `Harga: ${formatRupiah(input.variant.price)}`,
    `Subtotal: ${formatRupiah(subtotal)}`,
    `SKU: ${input.variant.sku ?? '-'}`,
    '',
    `Nama: ${input.customerName || '-'}`,
    `No. HP: ${input.customerPhone || '-'}`,
    `Alamat/Catatan: ${input.address || '-'}`,
    '',
    `Link: ${productUrl}`,
  ].join('\n')

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
