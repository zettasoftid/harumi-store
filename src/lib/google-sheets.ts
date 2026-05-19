import { getAdminProducts, type AdminProductWithRelations } from './supabase/products-admin'
import { getSalesReport, type SalesReportFilters, type SalesReportRow, type SalesReportSummary } from './supabase/sales'

export const DEFAULT_REPORT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1jK-xkwWBVv-dQF0wJlz5OeaE53v01JamUu8B3_lkVTc/edit?gid=0#gid=0'

export type GoogleSheetsSyncPayload = {
  filters: SalesReportFilters
  sheets: {
    finance: Array<Array<string | number | boolean>>
    product: Array<Array<string | number | boolean>>
  }
  spreadsheetUrl: string
  summary: SalesReportSummary
  syncedAt: string
}

export function getReportSheetUrl() {
  return import.meta.env.VITE_GOOGLE_SHEETS_REPORT_URL || DEFAULT_REPORT_SHEET_URL
}

export function salesReportToSheetRows(sales: SalesReportRow[]): Array<Array<string | number | boolean>> {
  const rows = sales.flatMap((sale) =>
    (sale.sale_items ?? []).map((item) => [
      sale.sale_date,
      item.products?.name ?? '',
      item.products?.categories?.name ?? '',
      item.product_variants?.size ?? '',
      item.product_variants?.color ?? '',
      item.qty,
      item.hpp,
      item.selling_price,
      item.gross_revenue,
      item.total_hpp,
      item.net_profit,
      sale.other_cost,
      sale.customer_name ?? '',
      sale.customer_phone ?? '',
      sale.customer_address_snapshot ?? sale.customer_profiles?.address ?? '',
      sale.note ?? '',
    ]),
  )

  return [
    [
      'Tanggal',
      'Produk',
      'Kategori',
      'Size',
      'Warna',
      'Qty',
      'HPP',
      'Harga Jual',
      'Gross Revenue',
      'Total HPP',
      'Net Profit Item',
      'Biaya Lain',
      'Pembeli',
      'No HP',
      'Alamat',
      'Catatan',
    ],
    ...rows,
  ]
}

export function productsToSheetRows(products: AdminProductWithRelations[]): Array<Array<string | number | boolean>> {
  const rows = products.flatMap((product) =>
    (product.product_variants ?? []).map((variant) => [
      product.id,
      variant.id,
      product.name,
      product.categories?.name ?? '',
      product.slug,
      variant.size,
      variant.color ?? '',
      variant.sku ?? '',
      variant.stock,
      variant.hpp,
      variant.selling_price,
      product.is_active,
      variant.is_active,
      product.condition_note ?? '',
      product.updated_at,
      variant.updated_at,
    ]),
  )

  return [
    [
      'product_id',
      'variant_id',
      'nama_produk',
      'kategori',
      'slug',
      'size',
      'warna',
      'sku',
      'stock',
      'hpp',
      'harga_jual',
      'product_active',
      'variant_active',
      'catatan_kondisi',
      'product_updated_at',
      'variant_updated_at',
    ],
    ...rows,
  ]
}

export async function buildGoogleSheetsSyncPayload(filters: SalesReportFilters = {}): Promise<GoogleSheetsSyncPayload> {
  const [report, products] = await Promise.all([
    getSalesReport(filters),
    getAdminProducts(),
  ])

  return {
    filters,
    sheets: {
      finance: salesReportToSheetRows(report.sales),
      product: productsToSheetRows(products),
    },
    spreadsheetUrl: getReportSheetUrl(),
    summary: report.summary,
    syncedAt: new Date().toISOString(),
  }
}

export async function syncHarumiDataToGoogleSheets(payload: GoogleSheetsSyncPayload) {
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL

  if (!webhookUrl) {
    throw new Error('VITE_GOOGLE_SHEETS_WEBHOOK_URL belum diisi.')
  }

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error(`Sync Google Sheets gagal (${response.status}).`)
  }

  return response.json().catch(() => ({ ok: true }))
}

export async function syncCurrentDataToGoogleSheets(filters: SalesReportFilters = {}) {
  const payload = await buildGoogleSheetsSyncPayload(filters)
  return syncHarumiDataToGoogleSheets(payload)
}

export async function quietlySyncCurrentDataToGoogleSheets(filters: SalesReportFilters = {}) {
  if (!import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL) return
  await syncCurrentDataToGoogleSheets(filters)
}
