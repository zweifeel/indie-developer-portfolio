import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Terminal, Radio } from 'lucide-react';
import { id } from '../locales/id';
import { calculateProjectStatistics } from '../services/projectService';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const stats = calculateProjectStatistics();

  const navLinks = [
    { path: '/', label: id.nav.home },
    { path: '/projects', label: id.nav.projects },
    { path: '/about', label: id.nav.about },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-800 bg-[#090b11]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-[#FAFAF9] hover:text-[#67E8F9] transition-colors focus:outline-hidden focus:ring-2 focus:ring-cyan-500 rounded-lg p-1"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 border border-stone-750 text-cyan-300 shadow-xs">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold tracking-tight text-sm sm:text-base text-[#FAFAF9] block">
              INDIE DEV
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#A8A29E] block -mt-1">
              STUDIO PORTFOLIO
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Navigasi Utama">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive(link.path)
                  ? 'bg-stone-850 text-[#FAFAF9] border border-stone-700 shadow-xs'
                  : 'text-[#A8A29E] hover:text-[#FAFAF9] hover:bg-stone-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Badge & Closed Testing status */}
        <div className="hidden sm:flex items-center gap-3">
          {stats.activeRecruitmentCount > 0 ? (
            <Link
              to="/projects?status=CLOSED_TESTING"
              className="inline-flex items-center gap-2 rounded-full border border-cyan-800/60 bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-200 hover:bg-cyan-900/60 transition-all hover:scale-[1.02] shadow-xs"
            >
              <Radio className="h-3 w-3 text-cyan-400 animate-pulse" />
              <span>{stats.activeRecruitmentCount} Butuh Penguji</span>
            </Link>
          ) : (
            <span className="text-xs font-mono text-[#78716C]">Google Play Ready</span>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#A8A29E] hover:text-[#FAFAF9] hover:bg-stone-850 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            aria-expanded={mobileMenuOpen}
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-800 bg-[#0f121d] px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-stone-850 text-[#FAFAF9] border border-stone-700'
                  : 'text-[#A8A29E] hover:text-[#FAFAF9] hover:bg-stone-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {stats.activeRecruitmentCount > 0 && (
            <Link
              to="/projects?status=CLOSED_TESTING"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-cyan-950/50 border border-cyan-800/40 text-sm font-semibold text-cyan-200"
            >
              <span className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                Perekrutan Closed Testing
              </span>
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs">
                {stats.activeRecruitmentCount} Aktif
              </span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
