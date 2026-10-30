import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Terminal, ShieldCheck, Heart } from 'lucide-react';
import { id } from '../locales/id';
import { developerProfile } from '../data/developer';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-stone-800 bg-[#08090f] text-[#A8A29E]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 border border-stone-750 text-cyan-400">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight text-[#FAFAF9] text-base">
                INDIE DEVELOPER STUDIO
              </span>
            </div>
            <p className="text-sm text-[#A8A29E] leading-relaxed max-w-md">
              {developerProfile.bio}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 text-xs font-mono text-[#E7E5E4]">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <a
                href={`mailto:${developerProfile.email}`}
                className="hover:text-cyan-300 transition-colors"
              >
                {developerProfile.email}
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAF9] mb-4">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-[#A8A29E] hover:text-[#67E8F9] transition-colors">
                  {id.nav.home}
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-[#A8A29E] hover:text-[#67E8F9] transition-colors">
                  {id.nav.projects}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-[#A8A29E] hover:text-[#67E8F9] transition-colors">
                  {id.nav.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Policy & Architecture */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FAFAF9] mb-4">
              Transparansi Biaya
            </h4>
            <div className="space-y-3 text-xs text-[#A8A29E]">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero-Cost-First Architecture: Bebas biaya berlangganan & mandatori API berbayar.</span>
              </div>
              <p className="text-[11px] text-[#78716C] leading-normal">
                Di-host di Cloudflare Pages Free, ditenagai Google Apps Script & Google Sheets.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-stone-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>{id.footer.copyright}</p>
          <p className="flex items-center gap-1.5">
            <span>Dibuat dengan dedikasi</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>untuk ekosistem Android Indonesia</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
