import { Navigate } from 'react-router'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { useAdminAccess } from '@/hooks/use-admin-access'

type AdminPlaceholderProps = {
  description: string
  title: string
}

export default function AdminPlaceholder({ description, title }: AdminPlaceholderProps) {
  const { isAllowed, isLoading, testBypass } = useAdminAccess()

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream font-body text-sm text-moss">
        Memuat admin...
      </main>
    )
  }

  if (!isAllowed) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <AdminLayout title={title} description={description} testBypass={testBypass}>
      <section className="rounded-lg border border-rose/10 bg-white p-6 shadow-card">
        <p className="font-body text-sm leading-relaxed text-moss">
          Modul ini sudah disiapkan di sidebar dan akan memakai service Supabase yang tersedia. Untuk saat ini, fokus pengelolaan katalog ada di halaman Katalog Produk.
        </p>
        <Button className="mt-5 rounded-lg bg-rose text-cream hover:bg-rose/90">
          Lanjutkan nanti
        </Button>
      </section>
    </AdminLayout>
  )
}
