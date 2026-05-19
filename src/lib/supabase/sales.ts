import { supabase } from './client'
import type { Inserts, Tables, Updates } from './database.types'
import { normalizeIndonesianPhone } from './auth'
import { isLocalBackendEnabled, localApi } from './local-api'

type SaleRow = Tables<'sales'>
type SaleItemRow = Tables<'sale_items'>
type ProductRow = Tables<'products'>
type VariantRow = Tables<'product_variants'>
type CategoryRow = Tables<'categories'>
type CustomerRow = Tables<'customer_profiles'>
type CheckoutIntentRow = Tables<'checkout_intents'>

type SaleItemWithRelations = SaleItemRow & {
  products: (ProductRow & { categories: CategoryRow | null }) | null
  product_variants: VariantRow | null
}

type SaleWithRelations = SaleRow & {
  customer_profiles: CustomerRow | null
  sale_items: SaleItemWithRelations[] | null
}

type CheckoutIntentWithRelations = CheckoutIntentRow & {
  products: (ProductRow & { categories: CategoryRow | null }) | null
  product_variants: VariantRow | null
}

type StockAdjustmentItem = {
  qty: number
  variant_id: string
}

export type SalesReportRow = SaleWithRelations

export type CreateSaleInput = {
  customer_address_snapshot?: string | null
  customer_id?: string | null
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

export type WinningProductInsight = {
  categoryName: string
  customerCount: number
  grossRevenue: number
  netProfit: number
  orderCount: number
  productId: string
  productName: string
  qtySold: number
}

export type CheckoutInterestInsight = {
  checkoutCount: number
  latestAt: string
  productId: string
  productName: string
  totalQty: number
  variantLabel: string
}

export type TopCustomerInsight = {
  customerId: string
  favoriteProductName: string
  grossRevenue: number
  name: string
  orderCount: number
  phone: string
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

  const customer = await findSaleCustomer(input.customer_id, input.customer_phone)
  const salePayload: Inserts<'sales'> = {
    customer_address_snapshot: input.customer_address_snapshot ?? customer?.address ?? null,
    customer_id: customer?.id ?? null,
    customer_name: input.customer_name ?? customer?.name ?? null,
    customer_phone: input.customer_phone ? normalizeIndonesianPhone(input.customer_phone) : customer?.phone ?? null,
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

  await adjustVariantStocks(input.items, -1)

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

  const customer = await findSaleCustomer(input.customer_id, input.customer_phone)
  const salePayload: Updates<'sales'> = {
    customer_address_snapshot: input.customer_address_snapshot ?? customer?.address ?? null,
    customer_id: customer?.id ?? null,
    customer_name: input.customer_name ?? customer?.name ?? null,
    customer_phone: input.customer_phone ? normalizeIndonesianPhone(input.customer_phone) : customer?.phone ?? null,
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

  const previousItems = await getSaleStockItems(saleId)
  await adjustVariantStocks(previousItems, 1)

  const { error: deleteItemsError } = await supabase.from('sale_items').delete().eq('sale_id', saleId)
  if (deleteItemsError) throw deleteItemsError

  const saleItems = await Promise.all(input.items.map((item) => buildSaleItem(sale.id, item)))
  const { data: insertedItems, error: itemsError } = await supabase.from('sale_items').insert(saleItems).select()

  if (itemsError) throw itemsError
  await adjustVariantStocks(input.items, -1)

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

  const previousItems = await getSaleStockItems(saleId)
  const { error } = await supabase.from('sales').delete().eq('id', saleId)

  if (error) throw error
  await adjustVariantStocks(previousItems, 1)
}

async function findSaleCustomer(customerId?: string | null, customerPhone?: string | null) {
  if (customerId) {
    const { data, error } = await supabase
      .from('customer_profiles')
      .select()
      .eq('id', customerId)
      .maybeSingle()

    if (error) throw error
    if (data) return data
  }

  if (!customerPhone?.trim()) return null

  const { data, error } = await supabase
    .from('customer_profiles')
    .select()
    .eq('phone', normalizeIndonesianPhone(customerPhone))
    .maybeSingle()

  if (error) throw error
  return data
}

async function getSaleStockItems(saleId: string): Promise<StockAdjustmentItem[]> {
  const { data, error } = await supabase
    .from('sale_items')
    .select('qty, variant_id')
    .eq('sale_id', saleId)

  if (error) throw error
  return data ?? []
}

async function adjustVariantStocks(items: StockAdjustmentItem[], direction: 1 | -1) {
  await Promise.all(
    items.map(async (item) => {
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('stock')
        .eq('id', item.variant_id)
        .single()

      if (variantError) throw variantError

      const nextStock = Math.max(variant.stock + (direction * item.qty), 0)
      const { error: stockError } = await supabase
        .from('product_variants')
        .update({ stock: nextStock })
        .eq('id', item.variant_id)

      if (stockError) throw stockError
    }),
  )
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
      customer_profiles (*),
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
    const [products, report, whatsappClicks, checkoutIntents, customers] = await Promise.all([
      localApi<Array<{ id: string; is_active: boolean; product_variants: Array<{ stock: number }> | null }>>('/products'),
      getSalesReport(),
      localApi<Array<{ id: string }>>('/wa-click-events'),
      localApi<CheckoutIntentWithRelations[]>('/checkout-intents'),
      localApi<CustomerRow[]>('/customers'),
    ])
    const activeProducts = products.filter((product) => product.is_active)
    const topCustomers = buildTopCustomers(report.sales)

    return {
      activeProducts: activeProducts.length,
      checkoutInterests: buildCheckoutInterests(checkoutIntents),
      customerSummary: {
        repeatCustomers: topCustomers.filter((customer) => customer.orderCount > 1).length,
        totalCustomers: customers.length,
      },
      grossRevenue: report.summary.grossRevenue,
      monthlySalesCount: report.summary.totalQty,
      netProfit: report.summary.netProfit,
      outOfStockProducts: activeProducts.filter((product) => (
        (product.product_variants ?? []).reduce((sum, variant) => sum + variant.stock, 0) === 0
      )).length,
      topCustomers,
      whatsappClicks: whatsappClicks.length,
      winningProducts: buildWinningProducts(report.sales),
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
    { data: checkoutIntents, error: checkoutIntentsError },
    { count: customerCount, error: customersError },
    allSales,
    monthlySales,
  ] = await Promise.all([
    supabase.from('products').select('id, is_active, product_variants (stock)'),
    supabase.from('wa_click_events').select('id', { count: 'exact', head: true }),
    supabase
      .from('checkout_intents')
      .select(`
        *,
        products (
          *,
          categories (*)
        ),
        product_variants (*)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
    getSalesReport(),
    getSalesReport({ dateFrom: firstDayOfMonth }),
  ])

  if (productsError) throw productsError
  if (clicksError) throw clicksError
  if (checkoutIntentsError) throw checkoutIntentsError
  if (customersError) throw customersError

  const productStocks = (products ?? []) as ProductStock[]
  const activeProducts = productStocks.filter((product) => product.is_active)
  const topCustomers = buildTopCustomers(allSales.sales)

  return {
    activeProducts: activeProducts.length,
    checkoutInterests: buildCheckoutInterests((checkoutIntents ?? []) as CheckoutIntentWithRelations[]),
    customerSummary: {
      repeatCustomers: topCustomers.filter((customer) => customer.orderCount > 1).length,
      totalCustomers: customerCount ?? 0,
    },
    grossRevenue: allSales.summary.grossRevenue,
    monthlySalesCount: monthlySales.summary.totalQty,
    netProfit: allSales.summary.netProfit,
    outOfStockProducts: activeProducts.filter((product) => {
      const stock = (product.product_variants ?? []).reduce((sum, variant) => sum + variant.stock, 0)
      return stock === 0
    }).length,
    topCustomers,
    whatsappClicks: whatsappClicks ?? 0,
    winningProducts: buildWinningProducts(allSales.sales),
  }
}

function buildWinningProducts(sales: SaleWithRelations[]): WinningProductInsight[] {
  type Aggregate = WinningProductInsight & {
    customerKeys: Set<string>
    orderKeys: Set<string>
  }

  const aggregates = new Map<string, Aggregate>()

  sales.forEach((sale) => {
    const customerKey = sale.customer_id ?? sale.customer_phone ?? sale.customer_name ?? sale.id

    ;(sale.sale_items ?? []).forEach((item) => {
      const productId = item.product_id
      const existing = aggregates.get(productId) ?? {
        categoryName: item.products?.categories?.name ?? '-',
        customerCount: 0,
        customerKeys: new Set<string>(),
        grossRevenue: 0,
        netProfit: 0,
        orderCount: 0,
        orderKeys: new Set<string>(),
        productId,
        productName: item.products?.name ?? 'Produk tanpa nama',
        qtySold: 0,
      }

      existing.qtySold += item.qty
      existing.grossRevenue += item.gross_revenue
      existing.netProfit += item.net_profit
      existing.orderKeys.add(sale.id)
      existing.customerKeys.add(customerKey)
      aggregates.set(productId, existing)
    })
  })

  return Array.from(aggregates.values())
    .map(({ customerKeys, orderKeys, ...row }) => ({
      ...row,
      customerCount: customerKeys.size,
      orderCount: orderKeys.size,
    }))
    .sort((first, second) => second.qtySold - first.qtySold || second.grossRevenue - first.grossRevenue)
    .slice(0, 5)
}

function buildCheckoutInterests(intents: CheckoutIntentWithRelations[]): CheckoutInterestInsight[] {
  type Aggregate = CheckoutInterestInsight & {
    latestTime: number
  }

  const aggregates = new Map<string, Aggregate>()

  intents.forEach((intent) => {
    const variant = intent.product_variants
    const variantLabel = [variant?.size, variant?.color].filter(Boolean).join(' / ') || '-'
    const key = `${intent.product_id}:${intent.variant_id}`
    const createdAt = new Date(intent.created_at).getTime()
    const existing = aggregates.get(key) ?? {
      checkoutCount: 0,
      latestAt: intent.created_at,
      latestTime: createdAt,
      productId: intent.product_id,
      productName: intent.products?.name ?? 'Produk tanpa nama',
      totalQty: 0,
      variantLabel,
    }

    existing.checkoutCount += 1
    existing.totalQty += intent.qty
    if (createdAt > existing.latestTime) {
      existing.latestAt = intent.created_at
      existing.latestTime = createdAt
    }
    aggregates.set(key, existing)
  })

  return Array.from(aggregates.values())
    .sort((first, second) => second.checkoutCount - first.checkoutCount || second.totalQty - first.totalQty)
    .slice(0, 5)
    .map((row) => ({
      checkoutCount: row.checkoutCount,
      latestAt: row.latestAt,
      productId: row.productId,
      productName: row.productName,
      totalQty: row.totalQty,
      variantLabel: row.variantLabel,
    }))
}

function buildTopCustomers(sales: SaleWithRelations[]): TopCustomerInsight[] {
  type Aggregate = TopCustomerInsight & {
    orderKeys: Set<string>
    products: Map<string, { name: string; qty: number }>
  }

  const aggregates = new Map<string, Aggregate>()

  sales.forEach((sale) => {
    const customerKey = sale.customer_id ?? sale.customer_phone
    if (!customerKey) return

    const existing = aggregates.get(customerKey) ?? {
      customerId: sale.customer_id ?? customerKey,
      favoriteProductName: '-',
      grossRevenue: 0,
      name: sale.customer_profiles?.name ?? sale.customer_name ?? 'Customer',
      orderCount: 0,
      orderKeys: new Set<string>(),
      phone: sale.customer_profiles?.phone ?? sale.customer_phone ?? '-',
      products: new Map<string, { name: string; qty: number }>(),
      totalQty: 0,
    }

    existing.orderKeys.add(sale.id)
    ;(sale.sale_items ?? []).forEach((item) => {
      existing.totalQty += item.qty
      existing.grossRevenue += item.gross_revenue

      const product = existing.products.get(item.product_id) ?? {
        name: item.products?.name ?? 'Produk tanpa nama',
        qty: 0,
      }
      product.qty += item.qty
      existing.products.set(item.product_id, product)
    })
    aggregates.set(customerKey, existing)
  })

  return Array.from(aggregates.values())
    .map(({ orderKeys, products, ...row }) => {
      const favorite = Array.from(products.values()).sort((first, second) => second.qty - first.qty)[0]

      return {
        ...row,
        favoriteProductName: favorite?.name ?? '-',
        orderCount: orderKeys.size,
      }
    })
    .sort((first, second) => second.totalQty - first.totalQty || second.grossRevenue - first.grossRevenue)
    .slice(0, 5)
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
      sale.customer_phone ?? '',
      sale.customer_address_snapshot ?? sale.customer_profiles?.address ?? '',
      sale.note ?? '',
    ]),
  )

  return [
    ['Tanggal', 'Produk', 'Size', 'Qty', 'HPP', 'Harga Jual', 'Gross Revenue', 'Total HPP', 'Net Profit Item', 'Biaya Lain', 'Pembeli', 'No HP', 'Alamat', 'Catatan'],
    ...rows,
  ]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
