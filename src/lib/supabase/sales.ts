import { supabase } from './client'
import type { Inserts, Tables, Updates } from './database.types'
import { isLocalBackendEnabled, localApi } from './local-api'

type SaleRow = Tables<'sales'>
type SaleItemRow = Tables<'sale_items'>
type ProductRow = Tables<'products'>
type VariantRow = Tables<'product_variants'>
type CategoryRow = Tables<'categories'>

type SaleItemWithRelations = SaleItemRow & {
  products: (ProductRow & { categories: CategoryRow | null }) | null
  product_variants: VariantRow | null
}

type SaleWithRelations = SaleRow & {
  sale_items: SaleItemWithRelations[] | null
}

export type SalesReportRow = SaleWithRelations

export type CreateSaleInput = {
  customer_name?: string | null
  customer_phone?: string | null
  items: Array<{
    product_id: string
    qty: number
    variant_id: string
  }>
  note?: string | null
  other_cost?: number
  sale_date?: string
}

export type SalesReportFilters = {
  categoryId?: string
  dateFrom?: string
  dateTo?: string
}

export type SalesReportSummary = {
  grossRevenue: number
  netProfit: number
  otherCost: number
  totalHpp: number
  totalQty: number
}

export async function createSale(input: CreateSaleInput) {
  if (isLocalBackendEnabled()) {
    const sale = await localApi<SalesReportRow>('/sales', {
      body: JSON.stringify(input),
      method: 'POST',
    })

    return {
      items: sale.sale_items ?? [],
      sale,
    }
  }

  const salePayload: Inserts<'sales'> = {
    customer_name: input.customer_name ?? null,
    customer_phone: input.customer_phone ?? null,
    note: input.note ?? null,
    other_cost: input.other_cost ?? 0,
  }

  if (input.sale_date) {
    salePayload.sale_date = input.sale_date
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(salePayload)
    .select()
    .single()

  if (saleError) throw saleError

  const saleItems = await Promise.all(input.items.map((item) => buildSaleItem(sale.id, item)))

  const { data: insertedItems, error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)
    .select()

  if (itemsError) throw itemsError

  await Promise.all(
    input.items.map(async (item) => {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single()

      if (variantError) throw variantError

      const { error: stockError } = await supabase
        .from('product_variants')
        .update({ stock: Math.max(variant.stock - item.qty, 0) })
        .eq('id', item.variant_id)

      if (stockError) throw stockError
    }),
  )

  return {
    items: insertedItems,
    sale,
  }
}

export async function updateSale(saleId: string, input: CreateSaleInput) {
  if (isLocalBackendEnabled()) {
    const sale = await localApi<SalesReportRow>(`/sales/${saleId}`, {
      body: JSON.stringify(input),
      method: 'PATCH',
    })

    return {
      items: sale.sale_items ?? [],
      sale,
    }
  }

  const salePayload: Updates<'sales'> = {
    customer_name: input.customer_name ?? null,
    customer_phone: input.customer_phone ?? null,
    note: input.note ?? null,
    other_cost: input.other_cost ?? 0,
  }

  if (input.sale_date) {
    salePayload.sale_date = input.sale_date
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .update(salePayload)
    .eq('id', saleId)
    .select()
    .single()

  if (saleError) throw saleError

  const { error: deleteItemsError } = await supabase.from('sale_items').delete().eq('sale_id', saleId)
  if (deleteItemsError) throw deleteItemsError

  const saleItems = await Promise.all(input.items.map((item) => buildSaleItem(sale.id, item)))
  const { data: insertedItems, error: itemsError } = await supabase.from('sale_items').insert(saleItems).select()

  if (itemsError) throw itemsError

  return {
    items: insertedItems,
    sale,
  }
}

export async function deleteSale(saleId: string) {
  if (isLocalBackendEnabled()) {
    await localApi<unknown>(`/sales/${saleId}`, { method: 'DELETE' })
    return
  }

  const { error } = await supabase.from('sales').delete().eq('id', saleId)

  if (error) throw error
}

async function buildSaleItem(
  saleId: string,
  item: { product_id: string; qty: number; variant_id: string },
): Promise<Inserts<'sale_items'>> {
  const { data: variant, error } = await supabase
    .from('product_variants')
    .select('hpp, selling_price')
    .eq('id', item.variant_id)
    .single()

  if (error) throw error

  return {
    hpp: variant.hpp,
    product_id: item.product_id,
    qty: item.qty,
    sale_id: saleId,
    selling_price: variant.selling_price,
    variant_id: item.variant_id,
  }
}

export async function getSalesReport(filters: SalesReportFilters = {}) {
  if (isLocalBackendEnabled()) {
    const data = await localApi<SalesReportRow[]>('/sales')
    const sales = data
      .map((sale) => ({
        ...sale,
        sale_items: (sale.sale_items ?? []).filter((item) => {
          if (filters.categoryId && item.products?.category_id !== filters.categoryId) return false
          return true
        }),
      }))
      .filter((sale) => {
        if (filters.dateFrom && sale.sale_date < filters.dateFrom) return false
        if (filters.dateTo && sale.sale_date > filters.dateTo) return false
        return (sale.sale_items ?? []).length > 0
      })

    return {
      sales,
      summary: summarizeSales(sales),
    }
  }

  let query = supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        products (
          *,
          categories (*)
        ),
        product_variants (*)
      )
    `)
    .order('sale_date', { ascending: false })

  if (filters.dateFrom) query = query.gte('sale_date', filters.dateFrom)
  if (filters.dateTo) query = query.lte('sale_date', filters.dateTo)

  const { data, error } = await query

  if (error) throw error

  const sales = ((data ?? []) as SaleWithRelations[])
    .map((sale) => ({
      ...sale,
      sale_items: (sale.sale_items ?? []).filter((item) => {
        if (!filters.categoryId) return true
        return item.products?.category_id === filters.categoryId
      }),
    }))
    .filter((sale) => (sale.sale_items ?? []).length > 0)

  return {
    sales,
    summary: summarizeSales(sales),
  }
}

export async function getDashboardSummary() {
  if (isLocalBackendEnabled()) {
    const [products, report] = await Promise.all([
      localApi<Array<{ is_active: boolean; product_variants: Array<{ stock: number }> | null }>>('/products'),
      getSalesReport(),
    ])
    const activeProducts = products.filter((product) => product.is_active)

    return {
      activeProducts: activeProducts.length,
      grossRevenue: report.summary.grossRevenue,
      monthlySalesCount: report.summary.totalQty,
      netProfit: report.summary.netProfit,
      outOfStockProducts: activeProducts.filter((product) => (
        (product.product_variants ?? []).reduce((sum, variant) => sum + variant.stock, 0) === 0
      )).length,
      whatsappClicks: 0,
    }
  }

  type ProductStock = {
    id: string
    is_active: boolean
    product_variants: Array<{ stock: number }> | null
  }

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const [
    { data: products, error: productsError },
    { count: whatsappClicks, error: clicksError },
    allSales,
    monthlySales,
  ] = await Promise.all([
    supabase.from('products').select('id, is_active, product_variants (stock)'),
    supabase.from('wa_click_events').select('id', { count: 'exact', head: true }),
    getSalesReport(),
    getSalesReport({ dateFrom: firstDayOfMonth }),
  ])

  if (productsError) throw productsError
  if (clicksError) throw clicksError

  const productStocks = (products ?? []) as ProductStock[]
  const activeProducts = productStocks.filter((product) => product.is_active)

  return {
    activeProducts: activeProducts.length,
    grossRevenue: allSales.summary.grossRevenue,
    monthlySalesCount: monthlySales.summary.totalQty,
    netProfit: allSales.summary.netProfit,
    outOfStockProducts: activeProducts.filter((product) => {
      const stock = (product.product_variants ?? []).reduce((sum, variant) => sum + variant.stock, 0)
      return stock === 0
    }).length,
    whatsappClicks: whatsappClicks ?? 0,
  }
}

export function summarizeSales(sales: SaleWithRelations[]): SalesReportSummary {
  return sales.reduce<SalesReportSummary>(
    (summary, sale) => {
      const saleGrossRevenue = (sale.sale_items ?? []).reduce((sum, item) => sum + item.gross_revenue, 0)
      const saleTotalHpp = (sale.sale_items ?? []).reduce((sum, item) => sum + item.total_hpp, 0)
      const saleNetProfit = (sale.sale_items ?? []).reduce((sum, item) => sum + item.net_profit, 0) - sale.other_cost
      const saleQty = (sale.sale_items ?? []).reduce((sum, item) => sum + item.qty, 0)

      return {
        grossRevenue: summary.grossRevenue + saleGrossRevenue,
        netProfit: summary.netProfit + saleNetProfit,
        otherCost: summary.otherCost + sale.other_cost,
        totalHpp: summary.totalHpp + saleTotalHpp,
        totalQty: summary.totalQty + saleQty,
      }
    },
    {
      grossRevenue: 0,
      netProfit: 0,
      otherCost: 0,
      totalHpp: 0,
      totalQty: 0,
    },
  )
}

export function salesReportToCsv(sales: SaleWithRelations[]) {
  const rows = sales.flatMap((sale) =>
    (sale.sale_items ?? []).map((item) => [
      sale.sale_date,
      item.products?.name ?? '',
      item.product_variants?.size ?? '',
      item.qty,
      item.hpp,
      item.selling_price,
      item.gross_revenue,
      item.total_hpp,
      item.net_profit,
      sale.other_cost,
      sale.customer_name ?? '',
      sale.note ?? '',
    ]),
  )

  return [
    ['Tanggal', 'Produk', 'Size', 'Qty', 'HPP', 'Harga Jual', 'Gross Revenue', 'Total HPP', 'Net Profit Item', 'Biaya Lain', 'Pembeli', 'Catatan'],
    ...rows,
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
