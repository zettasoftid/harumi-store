import { useEffect, useState } from 'react'
import { Navigate } from 'react-router'
import { Download, ExternalLink, Filter, RefreshCw } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { getCategories, getSalesReport, salesReportToCsv } from '@/lib/supabase'
import { buildGoogleSheetsSyncPayload, getReportSheetUrl, syncHarumiDataToGoogleSheets } from '@/lib/google-sheets'
import { useAdminAccess } from '@/hooks/use-admin-access'
import type { SalesReportRow, SalesReportSummary } from '@/lib/supabase'

type CategoryOption = {
  id: string
  name: string
}

const emptySummary: SalesReportSummary = {
  grossRevenue: 0,
  netProfit: 0,
  otherCost: 0,
  totalHpp: 0,
  totalQty: 0,
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export default function AdminReports() {
  const { isAllowed, isLoading, testBypass } = useAdminAccess()
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sales, setSales] = useState<SalesReportRow[]>([])
  const [summary, setSummary] = useState<SalesReportSummary>(emptySummary)
  const [syncStatus, setSyncStatus] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  async function refreshReport() {
    const report = await getSalesReport({
      categoryId: categoryId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
    setSales(report.sales)
    setSummary(report.summary)
  }

  useEffect(() => {
    if (!isAllowed) return

    getCategories()
      .then((data) => setCategories(data))
      .catch(() => setCategories([]))
  }, [isAllowed])

  useEffect(() => {
    if (!isAllowed) return
    getSalesReport({
      categoryId: categoryId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then((report) => {
        setSales(report.sales)
        setSummary(report.summary)
      })
      .catch(() => {
        setSales([])
        setSummary(emptySummary)
      })
  }, [categoryId, dateFrom, dateTo, isAllowed])

  function exportCsv() {
    const csv = salesReportToCsv(sales)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-harumi-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function syncToGoogleSheets() {
    setIsSyncing(true)
    setSyncStatus('')

    try {
      const payload = await buildGoogleSheetsSyncPayload({
        categoryId: categoryId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })

      await syncHarumiDataToGoogleSheets(payload)
      setSyncStatus('Sheet finance dan product berhasil disinkronkan ke Google Sheets.')
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : 'Gagal sync Google Sheets.')
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">Memuat laporan...</main>
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  const cards = [
    { label: 'Gross revenue', value: rupiah(summary.grossRevenue) },
    { label: 'Total HPP', value: rupiah(summary.totalHpp) },
    { label: 'Biaya lain', value: rupiah(summary.otherCost) },
    { label: 'Net profit', value: rupiah(summary.netProfit) },
    { label: 'Qty terjual', value: String(summary.totalQty) },
  ]

  return (
    <AdminLayout
      title="Laporan Penjualan"
      description="Filter penjualan berdasarkan tanggal dan kategori, lalu export CSV atau sync ke Google Sheets."
      testBypass={testBypass}
      action={
        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline" className="rounded-lg border-rose/20 text-rose hover:bg-clay/20">
            <a href={getReportSheetUrl()} target="_blank" rel="noreferrer">
              <ExternalLink />
              Google Sheets
            </a>
          </Button>
          <Button variant="outline" className="rounded-lg border-rose/20 text-rose hover:bg-clay/20" onClick={syncToGoogleSheets} disabled={isSyncing}>
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} />
            Sync Sheets
          </Button>
          <Button className="rounded-lg bg-rose text-cream hover:bg-rose/90" onClick={exportCsv}>
            <Download />
            Export CSV
          </Button>
        </div>
      }
    >
      {syncStatus && (
        <div className="mb-5 rounded-lg border border-rose/10 bg-white px-4 py-3 font-body text-sm text-moss shadow-card">
          {syncStatus}
        </div>
      )}

      <section className="mb-5 rounded-lg border border-rose/10 bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-11 rounded-lg border border-rose/15 bg-white px-3 font-body text-sm outline-none focus:border-rose" />
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-11 rounded-lg border border-rose/15 bg-white px-3 font-body text-sm outline-none focus:border-rose" />
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="h-11 rounded-lg border border-rose/15 bg-white px-3 font-body text-sm outline-none focus:border-rose">
            <option value="">Semua kategori</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <Button variant="outline" className="h-11 rounded-lg border-rose/20 text-rose" onClick={refreshReport}>
            <Filter />
            Terapkan
          </Button>
        </div>
      </section>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="rounded-lg border border-rose/10 bg-white p-5 shadow-card">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-moss">{card.label}</p>
            <p className="mt-2 font-body text-xl font-extrabold text-soil">{card.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-lg border border-rose/10 bg-white shadow-card">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
            <thead className="bg-cream/60 font-body text-xs uppercase tracking-widest text-moss">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">HPP</th>
                <th className="px-4 py-3">Harga jual</th>
                <th className="px-4 py-3">Gross</th>
                <th className="px-4 py-3">Net item</th>
                <th className="px-4 py-3">Pembeli</th>
                <th className="px-4 py-3">Alamat</th>
              </tr>
            </thead>
            <tbody>
              {sales.flatMap((sale) =>
                (sale.sale_items ?? []).map((item) => (
                  <tr key={`${sale.id}-${item.id}`} className="border-t border-rose/10 font-body text-sm">
                    <td className="px-4 py-4">{sale.sale_date}</td>
                    <td className="px-4 py-4 font-bold">{item.products?.name ?? '-'}</td>
                    <td className="px-4 py-4">{item.product_variants?.size ?? '-'}</td>
                    <td className="px-4 py-4">{item.qty}</td>
                    <td className="px-4 py-4">{rupiah(item.hpp)}</td>
                    <td className="px-4 py-4">{rupiah(item.selling_price)}</td>
                    <td className="px-4 py-4">{rupiah(item.gross_revenue)}</td>
                    <td className="px-4 py-4">{rupiah(item.net_profit)}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{sale.customer_name ?? sale.customer_profiles?.name ?? '-'}</p>
                      <p className="text-xs text-moss">{sale.customer_phone ?? sale.customer_profiles?.phone ?? '-'}</p>
                    </td>
                    <td className="px-4 py-4">{sale.customer_address_snapshot ?? sale.customer_profiles?.address ?? '-'}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  )
}
