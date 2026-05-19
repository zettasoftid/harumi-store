import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  PackagePlus,
  ReceiptText,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { clearAdminTestBypass, signOutAdmin } from '@/lib/supabase'

type AdminLayoutProps = {
  action?: ReactNode
  children: ReactNode
  description?: string
  testBypass?: boolean
  title: string
}

const navItems = [
  { href: '/admin', icon: Home, label: 'Overview' },
  { href: '/admin/products', icon: Boxes, label: 'Katalog Produk' },
  { href: '/admin/products/new', icon: PackagePlus, label: 'Tambah Produk' },
  { href: '/admin/sales', icon: ReceiptText, label: 'Input Penjualan' },
  { href: '/admin/reports', icon: BarChart3, label: 'Laporan' },
  { href: '/admin/settings', icon: Settings, label: 'Pengaturan' },
]

function isNavItemActive(href: string, pathname: string) {
  if (href === '/admin') return pathname === '/admin' || pathname === '/dashboard'
  if (href === '/admin/products') return pathname === '/admin/products' || /^\/admin\/products\/[^/]+\/edit$/.test(pathname)

  return pathname === href
}

export function AdminLayout({ action, children, description, testBypass, title }: AdminLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    clearAdminTestBypass()
    await signOutAdmin()
    navigate('/admin/login', { replace: true })
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-rose/10 bg-white">
      <div className="flex h-20 items-center gap-3 border-b border-rose/10 px-5">
        <div className="flex size-11 items-center justify-center rounded-lg bg-clay/30 text-rose">
          <ClipboardList size={21} />
        </div>
        <div>
          <p className="font-body text-[10px] font-extrabold uppercase tracking-widest text-rose">Admin</p>
          <h1 className="font-display text-2xl font-extrabold uppercase leading-none tracking-wide text-soil">Harumi Store</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const isActive = isNavItemActive(item.href, location.pathname)

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex h-11 items-center gap-3 rounded-lg px-3 font-body text-sm font-bold transition-colors',
                isActive
                  ? 'bg-rose text-cream shadow-sm'
                  : 'text-soil/75 hover:bg-clay/20 hover:text-rose',
              ].join(' ')}
            >
              <item.icon size={18} strokeWidth={1.8} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-rose/10 p-4">
        {testBypass && (
          <div className="mb-3 rounded-lg bg-clay/20 px-3 py-2 font-body text-xs leading-relaxed text-soil">
            Mode testing bypass nomor HP aktif.
          </div>
        )}
        <Button
          variant="outline"
          className="h-11 w-full justify-start rounded-lg border-rose/20 text-rose hover:bg-clay/20"
          onClick={handleLogout}
        >
          <LogOut />
          Keluar
        </Button>
      </div>
    </aside>
  )

  return (
    <main className="min-h-screen bg-cream text-soil">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            className="absolute inset-0 bg-soil/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full">
            {sidebar}
            <button
              type="button"
              aria-label="Tutup menu"
              className="absolute left-72 top-4 ml-3 flex size-10 items-center justify-center rounded-full bg-white text-soil shadow-card"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <section className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-rose/10 bg-cream/90 backdrop-blur">
          <div className="flex min-h-20 items-center justify-between gap-4 px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Buka menu"
                className="flex size-10 items-center justify-center rounded-lg border border-rose/15 bg-white text-soil lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="mb-1 flex items-center gap-2 font-body text-xs font-bold uppercase tracking-widest text-rose">
                  <ChevronLeft size={14} />
                  Dashboard Admin
                </div>
                <h2 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-wide text-soil">{title}</h2>
                {description && (
                  <p className="mt-1 max-w-2xl font-body text-sm leading-relaxed text-moss">{description}</p>
                )}
              </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        </header>

        <div className="px-5 py-6 sm:px-8">{children}</div>
      </section>
    </main>
  )
}
