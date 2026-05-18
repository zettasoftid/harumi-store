import { useState, useEffect } from 'react';
import { MessageCircle, Search, User } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Katalog', 'Daster', 'Sepatu Thrifting', 'Cara Pesan'];

  return (
    <>
      {/* Top announcement bar */}
      <div className="bg-soil text-white overflow-hidden h-8 flex items-center">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="font-body text-[10px] font-bold uppercase tracking-widest mx-8 flex items-center gap-8">
              <span>Katalog daster dan sepatu thrifting</span>
              <span className="opacity-50">·</span>
              <span>Pesan cepat lewat WhatsApp</span>
              <span className="opacity-50">·</span>
              <span>Harga ramah untuk harian</span>
              <span className="opacity-50">·</span>
              <span>Stok terbatas, update rutin</span>
              <span className="opacity-50">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-cream/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="section-padding">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <a href="/" className="font-body font-extrabold text-sm tracking-[0.16em] text-soil uppercase">
              Harumi Store
            </a>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="relative font-body font-bold text-[11px] uppercase tracking-[0.05em] text-soil group"
                >
                  {link}
                  <span className="absolute left-0 -bottom-1 w-full h-px bg-soil origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-4 lg:gap-6">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-soil hover:text-clay transition-colors"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <a href="#" className="hidden sm:block font-body font-bold text-[11px] uppercase tracking-[0.05em] text-soil hover:text-clay transition-colors">
                Tentang
              </a>
              <button className="text-soil hover:text-clay transition-colors" aria-label="Admin">
                <User size={18} strokeWidth={1.5} />
              </button>
              <button className="text-soil hover:text-clay transition-colors relative" aria-label="Chat WhatsApp">
                <MessageCircle size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 w-full bg-cream border-t border-soil/10 py-6 section-padding animate-in slide-in-from-top-2 duration-300">
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Cari daster, sepatu, ukuran..."
                className="w-full bg-transparent border-b-2 border-soil/20 py-3 pr-12 font-body text-lg text-soil placeholder:text-moss/50 focus:outline-none focus:border-soil transition-colors"
                autoFocus
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-moss" size={20} strokeWidth={1.5} />
            </div>
          </div>
        )}
      </header>
    </>
  );
}
