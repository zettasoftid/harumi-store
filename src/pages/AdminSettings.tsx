import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Save } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getStoreSettings, updateStoreSettings } from '@/lib/supabase'
import { useAdminAccess } from '@/hooks/use-admin-access'

export default function AdminSettings() {
  const { isAllowed, isLoading, testBypass } = useAdminAccess()
  const [adminWhatsapp, setAdminWhatsapp] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [message, setMessage] = useState('')
  const [storeName, setStoreName] = useState('Harumi Store')

  useEffect(() => {
    if (!isAllowed) return

    getStoreSettings()
      .then((settings) => {
        if (!settings) return
        setAdminWhatsapp(settings.admin_whatsapp)
        setInstagramUrl(settings.instagram_url ?? '')
        setStoreName(settings.store_name)
      })
      .catch(() => undefined)
  }, [isAllowed])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    await updateStoreSettings({
      admin_whatsapp: adminWhatsapp.replace(/[^\d]/g, ''),
      instagram_url: instagramUrl.trim() || null,
      store_name: storeName.trim() || 'Harumi Store',
    })
    setMessage('Pengaturan berhasil disimpan.')
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">Memuat pengaturan...</main>
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminLayout title="Pengaturan" description="Kelola identitas toko dan nomor WhatsApp admin untuk CTA katalog." testBypass={testBypass}>
      <form className="max-w-2xl space-y-5 rounded-lg border border-rose/10 bg-white p-5 shadow-card" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>Nama toko</Label>
          <Input value={storeName} onChange={(event) => setStoreName(event.target.value)} className="h-11 rounded-lg border-rose/15" />
        </div>
        <div className="space-y-2">
          <Label>Nomor WhatsApp admin</Label>
          <Input value={adminWhatsapp} onChange={(event) => setAdminWhatsapp(event.target.value)} placeholder="6281339691260" className="h-11 rounded-lg border-rose/15" />
          <p className="font-body text-xs text-moss">Gunakan format internasional tanpa plus untuk link WhatsApp, contoh 62812...</p>
        </div>
        <div className="space-y-2">
          <Label>Instagram URL</Label>
          <Input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} placeholder="https://instagram.com/harumistore" className="h-11 rounded-lg border-rose/15" />
        </div>
        {message && <p className="rounded-lg bg-moss/10 px-3 py-2 font-body text-sm text-soil">{message}</p>}
        <Button className="h-11 rounded-lg bg-rose text-cream hover:bg-rose/90">
          <Save />
          Simpan Pengaturan
        </Button>
      </form>
    </AdminLayout>
  )
}
