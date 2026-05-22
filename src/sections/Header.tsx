import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Menu, Search, User, X } from 'lucide-react';

type HeaderProps = {
  solidAtTop?: boolean
}

export default function Header({ solidAtTop = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isSolid = solidAtTop || scrolled || searchOpen || mobileMenuOpen;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/products', label: 'Katalog' },
    { href: '/products?category=daster', label: 'Daster' },
    { href: '/products?category=sepatu-thrifting', label: 'Sepatu Thrifting' },
    { href: '/#cara-pesan', label: 'Cara Pesan' },
  ];

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    window.location.href = query ? `/products?search=${encodeURIComponent(query)}` : '/products';
  }

  return (
    <header
      className={[
        'fixed left-0 top-0 z-50 w-full transition-all duration-500',
        isSolid
          ? 'border-b border-rose/10 bg-cream/95 shadow-sm backdrop-blur-md'
          : 'bg-transparent',
      ].join(' ')}
    >
        <div className="section-padding">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Logo */}
            <a
              href="/"
              className={[
                'font-body text-sm font-extrabold uppercase tracking-[0.16em] transition-colors',
                isSolid ? 'text-soil' : 'text-white',
              ].join(' ')}
            >
              Harumi Store
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={[
                    'group relative font-body text-[11px] font-bold uppercase tracking-[0.05em] transition-colors',
                    isSolid ? 'text-soil hover:text-rose' : 'text-white/90 hover:text-white',
                  ].join(' ')}
                >
                  {link.label}
                  <span
                    className={[
                      'absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100',
                      isSolid ? 'bg-soil' : 'bg-white',
                    ].join(' ')}
                  />
                </a>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={[
                  'transition-colors',
                  isSolid ? 'text-soil hover:text-rose' : 'text-white/90 hover:text-white',
                ].join(' ')}
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <a
                href="/#tentang"
                className={[
                  'hidden font-body text-[11px] font-bold uppercase tracking-[0.05em] transition-colors lg:block',
                  isSolid ? 'text-soil hover:text-rose' : 'text-white/90 hover:text-white',
                ].join(' ')}
              >
                Tentang
              </a>
              <a
                href="/admin/login"
                className={[
                  'transition-colors',
                  isSolid ? 'text-soil hover:text-rose' : 'text-white/90 hover:text-white',
                ].join(' ')}
                aria-label="Login admin"
              >
                <User size={18} strokeWidth={1.5} />
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((current) => !current)}
                className={[
                  'transition-colors lg:hidden',
                  isSolid ? 'text-soil hover:text-rose' : 'text-white/90 hover:text-white',
                ].join(' ')}
                aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              >
                {mobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-rose/10 bg-cream px-6 pb-6 pt-3 shadow-sm lg:hidden">
            <nav className="grid gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-3 font-body text-xs font-extrabold uppercase tracking-widest text-soil transition-colors hover:bg-clay/20 hover:text-rose"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/admin/login"
                className="mt-2 rounded-lg bg-rose px-3 py-3 text-center font-body text-xs font-extrabold uppercase tracking-widest text-cream transition-colors hover:bg-rose/90"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login Admin
              </a>
            </nav>
          </div>
        )}

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 w-full bg-cream border-t border-soil/10 py-6 section-padding animate-in slide-in-from-top-2 duration-300">
            <form className="relative max-w-2xl mx-auto" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Cari daster, sepatu, ukuran..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-transparent border-b-2 border-soil/20 py-3 pr-12 font-body text-lg text-soil placeholder:text-moss/50 focus:outline-none focus:border-soil transition-colors"
                autoFocus
              />
              <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-moss transition-colors hover:text-rose" aria-label="Cari produk">
                <Search size={20} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        )}
      </header>
  );
}
