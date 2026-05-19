import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { BarChart3, Boxes, MessageCircle, PackagePlus, PackageX, ReceiptText, Trophy, UsersRound } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { getDashboardSummary } from '@/lib/supabase'
import { useAdminAccess } from '@/hooks/use-admin-access'

type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>

const emptySummary: DashboardSummary = {
  activeProducts: 0,
  checkoutInterests: [],
  customerSummary: {
    repeatCustomers: 0,
    totalCustomers: 0,
  },
  grossRevenue: 0,
  monthlySalesCount: 0,
  netProfit: 0,
  outOfStockProducts: 0,
  topCustomers: [],
  whatsappClicks: 0,
  winningProducts: [],
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export default function AdminDashboard() {
  const { isAllowed, isLoading, testBypass } = useAdminAccess()
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)

  useEffect(() => {
    if (!isAllowed) return

    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(emptySummary))
  }, [isAllowed])

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">
        Memuat dashboard...
      </main>
    )
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  const cards = [
    { label: 'Produk aktif', value: summary.activeProducts.toString(), icon: Boxes },
    { label: 'Produk habis', value: summary.outOfStockProducts.toString(), icon: PackageX },
    { label: 'Gross revenue', value: rupiah(summary.grossRevenue), icon: BarChart3 },
    { label: 'Net profit', value: rupiah(summary.netProfit), icon: ReceiptText },
    { label: 'Penjualan bulan ini', value: summary.monthlySalesCount.toString(), icon: ReceiptText },
    { label: 'Klik WhatsApp', value: summary.whatsappClicks.toString(), icon: MessageCircle },
    { label: 'Customer', value: summary.customerSummary.totalCustomers.toString(), icon: UsersRound },
    { label: 'Repeat customer', value: summary.customerSummary.repeatCustomers.toString(), icon: Trophy },
  ]

  return (
    <AdminLayout
      title="Overview"
      description="Ringkasan performa katalog, penjualan manual, profit, dan klik WhatsApp sesuai MVP Harumi Store."
      testBypass={testBypass}
      action={
        <Button asChild className="hidden rounded-lg bg-rose text-cream hover:bg-rose/90 sm:inline-flex">
          <Link to="/admin/products/new">
            <PackagePlus />
            Tambah Produk
          </Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
            <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-clay/25 text-rose">
              <card.icon size={18} />
            </div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">{card.label}</p>
            <p className="mt-2 font-body text-2xl font-extrabold text-soil">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-lg border border-rose/10 bg-white shadow-card">
          <div className="border-b border-rose/10 p-5">
            <h3 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Winning Product</h3>
            <p className="mt-1 font-body text-xs text-moss">Dihitung dari penjualan terkonfirmasi.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-cream/60 font-body text-xs uppercase tracking-widest text-moss">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Profit</th>
                  <th className="px-4 py-3">Customer</th>
                </tr>
              </thead>
              <tbody>
                {summary.winningProducts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-5 font-body text-sm text-moss" colSpan={5}>Belum ada penjualan terkonfirmasi.</td>
                  </tr>
                ) : summary.winningProducts.map((product) => (
                  <tr key={product.productId} className="border-t border-rose/10 font-body text-sm">
                    <td className="px-4 py-4">
                      <p className="font-extrabold text-soil">{product.productName}</p>
                      <p className="text-xs text-moss">{product.categoryName}</p>
                    </td>
                    <td className="px-4 py-4">{product.qtySold}</td>
                    <td className="px-4 py-4">{rupiah(product.grossRevenue)}</td>
                    <td className="px-4 py-4">{rupiah(product.netProfit)}</td>
                    <td className="px-4 py-4">{product.customerCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-rose/10 bg-white shadow-card">
          <div className="border-b border-rose/10 p-5">
            <h3 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Minat Checkout</h3>
            <p className="mt-1 font-body text-xs text-moss">Produk yang paling sering dibawa ke WhatsApp.</p>
          </div>
          <div className="divide-y divide-rose/10">
            {summary.checkoutInterests.length === 0 ? (
              <p className="p-5 font-body text-sm text-moss">Belum ada checkout intent.</p>
            ) : summary.checkoutInterests.map((item) => (
              <div key={`${item.productId}-${item.variantLabel}`} className="p-4 font-body">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-soil">{item.productName}</p>
                    <p className="mt-1 text-xs text-moss">{item.variantLabel}</p>
                  </div>
                  <span className="rounded-full bg-clay/25 px-3 py-1 text-xs font-extrabold text-rose">{item.checkoutCount}x</span>
                </div>
                <p className="mt-2 text-xs text-moss">Total qty diminati: {item.totalQty}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg border border-rose/10 bg-white shadow-card">
        <div className="border-b border-rose/10 p-5">
          <h3 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Customer Paling Aktif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-cream/60 font-body text-xs uppercase tracking-widest text-moss">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Produk favorit</th>
              </tr>
            </thead>
            <tbody>
              {summary.topCustomers.length === 0 ? (
                <tr>
                  <td className="px-4 py-5 font-body text-sm text-moss" colSpan={5}>Belum ada customer dengan penjualan terkonfirmasi.</td>
                </tr>
              ) : summary.topCustomers.map((customer) => (
                <tr key={customer.customerId} className="border-t border-rose/10 font-body text-sm">
                  <td className="px-4 py-4">
                    <p className="font-extrabold text-soil">{customer.name}</p>
                    <p className="text-xs text-moss">{customer.phone}</p>
                  </td>
                  <td className="px-4 py-4">{customer.orderCount}</td>
                  <td className="px-4 py-4">{customer.totalQty}</td>
                  <td className="px-4 py-4">{rupiah(customer.grossRevenue)}</td>
                  <td className="px-4 py-4">{customer.favoriteProductName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
