import { useState, useEffect } from 'react';
import gsap from 'gsap';

export default function NewsletterPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo('.popup-panel', 
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(43, 43, 43, 0.5)' }}>
      <div className="popup-panel bg-cream rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl relative">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-soil/10 flex items-center justify-center text-soil hover:bg-soil/20 transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left image */}
          <div className="hidden md:block md:w-2/5 relative">
            <img
              src="/images/hero-wellness-bg.webp"
              alt="Harumi Store"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-soil/10" />
          </div>

          {/* Right content */}
          <div className="flex-1 p-8 lg:p-12">
            <h3 className="font-display text-3xl font-extrabold uppercase leading-tight tracking-wide text-soil lg:text-4xl">
              Dapatkan <em>Update</em> Katalog<br />Harumi Store
            </h3>
            <p className="font-body text-moss text-sm mt-4 leading-relaxed">
              Tinggalkan email untuk kabar produk baru, stok pilihan, dan promo sederhana dari Harumi.
            </p>

            <div className="mt-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="w-full bg-white border border-soil/15 rounded-full px-5 py-3 font-body text-sm text-soil placeholder:text-moss/50 focus:outline-none focus:border-soil/40 transition-colors"
              />
              <button className="w-full mt-4 py-3 rounded-full bg-clay text-white font-body font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
                Daftar
              </button>
            </div>

            <p className="font-body text-[10px] text-moss mt-6 text-center">
              &copy; 2025 Harumi Store | Baca{' '}
              <a href="#" className="underline hover:text-soil transition-colors">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
