import type { CheckoutProduct } from './checkout'

export const featuredProducts: CheckoutProduct[] = [
  {
    id: 'daster-sakura-rayon',
    name: 'Daster Sakura Rayon',
    vendor: 'DASTER',
    image: '/images/products/chocolate-cashew.webp',
    variants: [
      { id: 'daster-sakura-rayon-m-pink', size: 'M', color: 'Soft Pink', stock: 8, price: 65000 },
      { id: 'daster-sakura-rayon-l-pink', size: 'L', color: 'Soft Pink', stock: 4, price: 65000 },
      { id: 'daster-sakura-rayon-xl-sage', size: 'XL', color: 'Sage', stock: 0, price: 68000 },
    ],
  },
  {
    id: 'daster-rumah-motif-bunga',
    name: 'Daster Rumah Motif Bunga',
    vendor: 'DASTER',
    image: '/images/products/tongue-scraper.webp',
    variants: [
      { id: 'daster-bunga-m-cream', size: 'M', color: 'Cream', stock: 7, price: 58000 },
      { id: 'daster-bunga-l-cream', size: 'L', color: 'Cream', stock: 3, price: 58000 },
      { id: 'daster-bunga-xl-rose', size: 'XL', color: 'Rose', stock: 0, price: 62000 },
    ],
  },
  {
    id: 'sepatu-thrifting-casual-cream',
    name: 'Sepatu Thrifting Casual Cream',
    vendor: 'SEPATU THRIFTING',
    image: '/images/products/olive-oil.webp',
    variants: [
      { id: 'sepatu-casual-37-cream', size: '37', color: 'Cream', stock: 1, price: 95000 },
      { id: 'sepatu-casual-38-cream', size: '38', color: 'Cream', stock: 0, price: 95000 },
      { id: 'sepatu-casual-39-putih', size: '39', color: 'Putih', stock: 2, price: 98000 },
    ],
  },
  {
    id: 'daster-busui-soft-pink',
    name: 'Daster Busui Soft Pink',
    vendor: 'DASTER',
    image: '/images/products/peppermint-mints.webp',
    variants: [
      { id: 'daster-busui-l-soft-pink', size: 'L', color: 'Soft Pink', stock: 5, price: 72000 },
      { id: 'daster-busui-xl-soft-pink', size: 'XL', color: 'Soft Pink', stock: 0, price: 72000 },
      { id: 'daster-busui-xxl-mauve', size: 'XXL', color: 'Mauve', stock: 2, price: 78000 },
    ],
  },
  {
    id: 'sepatu-slip-on-hitam',
    name: 'Sepatu Slip On Hitam',
    vendor: 'SEPATU THRIFTING',
    image: '/images/products/mango-chunks.webp',
    variants: [
      { id: 'slip-on-38-hitam', size: '38', color: 'Hitam', stock: 2, price: 88000 },
      { id: 'slip-on-39-hitam', size: '39', color: 'Hitam', stock: 1, price: 88000 },
      { id: 'slip-on-40-coklat', size: '40', color: 'Coklat', stock: 0, price: 90000 },
    ],
  },
  {
    id: 'daster-adem-harian',
    name: 'Daster Adem Harian',
    vendor: 'DASTER',
    image: '/images/products/cereal-hoops.webp',
    variants: [
      { id: 'daster-adem-m-hijau', size: 'M', color: 'Hijau', stock: 9, price: 55000 },
      { id: 'daster-adem-l-biru', size: 'L', color: 'Biru', stock: 6, price: 55000 },
      { id: 'daster-adem-xl-hijau', size: 'XL', color: 'Hijau', stock: 0, price: 59000 },
    ],
  },
]

export const exclusiveProducts: CheckoutProduct[] = [
  { ...featuredProducts[0], image: '/images/products/nutbutter-chocolate.webp', bestSeller: true },
  { ...featuredProducts[1], image: '/images/products/chips-seasalt.webp', bestSeller: true },
  { ...featuredProducts[2], image: '/images/products/nutbutter-chocolate.webp' },
  { ...featuredProducts[3], image: '/images/products/pasta-lentil.webp' },
  { ...featuredProducts[4], image: '/images/products/tahini-raw.webp' },
  { ...featuredProducts[5], image: '/images/products/ghee-organic.webp' },
]
