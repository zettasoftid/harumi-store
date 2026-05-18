import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { BarChart3, Boxes, MessageCircle, PackagePlus, PackageX, ReceiptText } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { getDashboardSummary } from '@/lib/supabase'
import { useAdminAccess } from '@/hooks/use-admin-access'

type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>

const emptySummary: DashboardSummary = {
  activeProducts: 0,
  grossRevenue: 0,
  monthlySalesCount: 0,
  netProfit: 0,
  outOfStockProducts: 0,
  whatsappClicks: 0,
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
          <h3 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Prioritas Hari Ini</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['Cek stok habis', 'Upload foto produk', 'Input penjualan WhatsApp'].map((item) => (
              <div key={item} className="rounded-lg bg-cream px-4 py-3 font-body text-sm font-bold text-soil">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
          <h3 className="font-body text-sm font-extrabold uppercase tracking-widest text-soil">Brand Harumi</h3>
          <p className="mt-3 font-body text-sm leading-relaxed text-moss">
            Cantik, ramah, sederhana, dan terpercaya. Sidebar admin dibuat ringkas supaya input katalog tetap cepat.
          </p>
        </section>
      </div>
    </AdminLayout>
  )
}
