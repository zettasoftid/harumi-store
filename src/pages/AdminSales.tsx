import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Edit3, Plus, Save, Trash2 } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createSale, deleteSale, getAdminProducts, getSalesReport, updateSale } from '@/lib/supabase'
import { useAdminAccess } from '@/hooks/use-admin-access'
import type { SalesReportRow } from '@/lib/supabase'

type ProductOption = {
  id: string
  name: string
  product_variants: Array<{
    id: string
    selling_price: number
    size: string
    stock: number
  }> | null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(value)
}

export default function AdminSales() {
  const { isAllowed, isLoading, testBypass } = useAdminAccess()
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [otherCost, setOtherCost] = useState('0')
  const [productId, setProductId] = useState('')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [qty, setQty] = useState('1')
  const [saleDate, setSaleDate] = useState(today())
  const [sales, setSales] = useState<SalesReportRow[]>([])
  const [submitError, setSubmitError] = useState('')
  const [variantId, setVariantId] = useState('')

  const selectedProduct = useMemo(() => products.find((product) => product.id === productId), [productId, products])
  const variants = useMemo(() => selectedProduct?.product_variants ?? [], [selectedProduct])

  async function refreshSales() {
    const report = await getSalesReport()
    setSales(report.sales)
  }

  useEffect(() => {
    if (!isAllowed) return

    getAdminProducts()
      .then((data) => {
        const rows = (data ?? []) as ProductOption[]
        setProducts(rows)
        setProductId((current) => current || rows[0]?.id || '')
        setVariantId((current) => current || rows[0]?.product_variants?.[0]?.id || '')
      })
      .catch(() => setProducts([]))

    getSalesReport()
      .then((report) => setSales(report.sales))
      .catch(() => setSales([]))
  }, [isAllowed])

  function resetForm() {
    setCustomerName('')
    setCustomerPhone('')
    setEditingSaleId(null)
    setNote('')
    setOtherCost('0')
    setQty('1')
    setSaleDate(today())
    setSubmitError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError('')

    if (!productId || !variantId || Number(qty) <= 0) {
      setSubmitError('Produk, size, dan qty wajib diisi.')
      return
    }

    const payload = {
      customer_name: customerName.trim() || null,
      customer_phone: customerPhone.trim() || null,
      items: [{ product_id: productId, qty: Number(qty), variant_id: variantId }],
      note: note.trim() || null,
      other_cost: Number(otherCost) || 0,
      sale_date: saleDate,
    }

    try {
      if (editingSaleId) {
        await updateSale(editingSaleId, payload)
      } else {
        await createSale(payload)
      }
      resetForm()
      await refreshSales()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Gagal menyimpan penjualan.')
    }
  }

  function handleEdit(sale: SalesReportRow) {
    const firstItem = sale.sale_items?.[0]
    if (!firstItem) return

    setCustomerName(sale.customer_name ?? '')
    setCustomerPhone(sale.customer_phone ?? '')
    setEditingSaleId(sale.id)
    setNote(sale.note ?? '')
    setOtherCost(String(sale.other_cost))
    setProductId(firstItem.product_id)
    setQty(String(firstItem.qty))
    setSaleDate(sale.sale_date)
    setVariantId(firstItem.variant_id)
  }

  async function handleDelete(sale: SalesReportRow) {
    if (!window.confirm(`Hapus penjualan tanggal ${sale.sale_date}?`)) return

    try {
      await deleteSale(sale.id)
      await refreshSales()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Gagal menghapus penjualan.')
    }
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">Memuat penjualan...</main>
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminLayout title="Input Penjualan" description="Catat penjualan manual setelah transaksi WhatsApp selesai." testBypass={testBypass}>
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <form className="space-y-4 rounded-lg border border-rose/10 bg-white p-5 shadow-card" onSubmit={handleSubmit}>
          <h3 className="font-body text-sm font-extrabold uppercase tracking-widest">{editingSaleId ? 'Edit Penjualan' : 'Penjualan Baru'}</h3>
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} className="h-11 rounded-lg border-rose/15" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-2">
              <Label>Nama pembeli</Label>
              <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} className="h-11 rounded-lg border-rose/15" />
            </div>
            <div className="space-y-2">
              <Label>No HP pembeli</Label>
              <Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} className="h-11 rounded-lg border-rose/15" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Produk</Label>
            <select
              value={productId}
              onChange={(event) => {
                const nextProductId = event.target.value
                const nextProduct = products.find((product) => product.id === nextProductId)
                setProductId(nextProductId)
                setVariantId(nextProduct?.product_variants?.[0]?.id ?? '')
              }}
              className="h-11 w-full rounded-lg border border-rose/15 bg-white px-3 font-body text-sm outline-none focus:border-rose"
            >
              <option value="">Pilih produk</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Size</Label>
              <select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="h-11 w-full rounded-lg border border-rose/15 bg-white px-3 font-body text-sm outline-none focus:border-rose">
                <option value="">-</option>
                {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.size}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Qty</Label>
              <Input value={qty} onChange={(event) => setQty(event.target.value)} inputMode="numeric" className="h-11 rounded-lg border-rose/15" />
            </div>
            <div className="space-y-2">
              <Label>Biaya lain</Label>
              <Input value={otherCost} onChange={(event) => setOtherCost(event.target.value)} inputMode="numeric" className="h-11 rounded-lg border-rose/15" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Catatan</Label>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-20 w-full rounded-lg border border-rose/15 bg-white px-3 py-3 font-body text-sm outline-none focus:border-rose" />
          </div>
          {submitError && <p className="rounded-lg bg-rose/10 px-3 py-2 font-body text-sm text-rose">{submitError}</p>}
          <div className="flex gap-3">
            <Button type="submit" className="h-11 flex-1 rounded-lg bg-rose text-cream hover:bg-rose/90">
              {editingSaleId ? <Save /> : <Plus />}
              {editingSaleId ? 'Update' : 'Simpan'}
            </Button>
            {editingSaleId && (
              <Button type="button" variant="outline" className="h-11 rounded-lg border-rose/20 text-rose" onClick={resetForm}>Batal</Button>
            )}
          </div>
        </form>

        <section className="overflow-hidden rounded-lg border border-rose/10 bg-white shadow-card">
          <div className="border-b border-rose/10 p-4">
            <h3 className="font-body text-sm font-extrabold uppercase tracking-widest">Data Penjualan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-cream/60 font-body text-xs uppercase tracking-widest text-moss">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Produk</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Profit</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const item = sale.sale_items?.[0]
                  const gross = sale.sale_items?.reduce((sum, row) => sum + row.gross_revenue, 0) ?? 0
                  const profit = (sale.sale_items?.reduce((sum, row) => sum + row.net_profit, 0) ?? 0) - sale.other_cost

                  return (
                    <tr key={sale.id} className="border-t border-rose/10 font-body text-sm">
                      <td className="px-4 py-4">{sale.sale_date}</td>
                      <td className="px-4 py-4 font-bold">{item?.products?.name ?? '-'}</td>
                      <td className="px-4 py-4">{item?.qty ?? 0}</td>
                      <td className="px-4 py-4">{rupiah(gross)}</td>
                      <td className="px-4 py-4">{rupiah(profit)}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon-sm" className="border-rose/20 text-rose" onClick={() => handleEdit(sale)} aria-label="Edit penjualan"><Edit3 /></Button>
                          <Button variant="outline" size="icon-sm" className="border-rose/20 text-rose" onClick={() => handleDelete(sale)} aria-label="Hapus penjualan"><Trash2 /></Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
