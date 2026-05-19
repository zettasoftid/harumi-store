import { useState } from 'react';
import { ArrowRight, Mail, Instagram, Linkedin } from 'lucide-react';

const discoverLinks = ['Katalog Daster', 'Sepatu Thrifting', 'Produk Terbaru'];
const supportLinks = ['Cara Pesan', 'Checkout', 'FAQ'];
const exploreLinks = ['Tentang Harumi', 'Katalog Harumi', 'Laporan Admin'];
const legalLinks = ['Syarat & Ketentuan', 'Kebijakan Privasi'];

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
      <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
      <path d="M9.5 15.5a5 5 0 0 0 5 0" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState('');

  return (
    <footer className="bg-soil text-cream">
      <div className="section-padding py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Newsletter */}
            <div className="lg:col-span-5">
              <h3 className="font-display text-3xl font-extrabold uppercase tracking-wide text-cream lg:text-4xl">
                Tetap Dekat <em>Dengan Harumi</em>
              </h3>
              <div className="mt-6 flex">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email atau nomor WhatsApp"
                  className="flex-1 bg-transparent border-b border-cream/30 py-3 font-body text-sm text-cream placeholder:text-cream/40 focus:outline-none focus:border-cream transition-colors"
                />
                <button className="px-4 py-3 border-b border-cream/30 text-cream hover:text-clay transition-colors" aria-label="Subscribe">
                  <ArrowRight size={20} />
                </button>
              </div>
              <div className="flex gap-4 mt-8">
                <a href="#" className="text-cream/60 hover:text-cream transition-colors" aria-label="Email">
                  <Mail size={18} strokeWidth={1.5} />
                </a>
                <a href="#" className="text-cream/60 hover:text-cream transition-colors" aria-label="Instagram">
                  <Instagram size={18} strokeWidth={1.5} />
                </a>
                <a href="#" className="text-cream/60 hover:text-cream transition-colors" aria-label="LinkedIn">
                  <Linkedin size={18} strokeWidth={1.5} />
                </a>
                <a href="#" className="text-cream/60 hover:text-cream transition-colors" aria-label="WhatsApp">
                  <WhatsAppIcon />
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h4 className="font-body font-bold text-xs uppercase tracking-widest text-cream/60 mb-4">
                    Katalog
                  </h4>
                  <ul className="space-y-3">
                    {discoverLinks.map((link) => (
                      <li key={link}>
                        <a href="#" className="font-body text-sm text-cream/80 hover:text-cream transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-body font-bold text-xs uppercase tracking-widest text-cream/60 mb-4">
                    Bantuan
                  </h4>
                  <ul className="space-y-3">
                    {supportLinks.map((link) => (
                      <li key={link}>
                        <a href="#" className="font-body text-sm text-cream/80 hover:text-cream transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-body font-bold text-xs uppercase tracking-widest text-cream/60 mb-4">
                    Admin
                  </h4>
                  <ul className="space-y-3">
                    {exploreLinks.map((link) => (
                      <li key={link}>
                        <a href="#" className="font-body text-sm text-cream/80 hover:text-cream transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-16 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              {legalLinks.map((link) => (
                <a key={link} href="#" className="font-body text-xs text-cream/50 hover:text-cream/80 transition-colors">
                  {link}
                </a>
              ))}
            </div>
            <p className="font-body text-xs text-cream/50">
              &copy; 2025 Harumi Store
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
