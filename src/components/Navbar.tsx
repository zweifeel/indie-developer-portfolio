import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Radio } from 'lucide-react';
import { id } from '../locales/id';
import { calculateProjectStatistics } from '../services/projectService';
import { useSiteSettings } from '../services/cmsSettingsService';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const stats = calculateProjectStatistics();
  const { settings } = useSiteSettings();

  const navLinks = settings.navigation && settings.navigation.length > 0
    ? settings.navigation.map((item) => ({ path: item.path, label: item.label, isExternal: item.isExternal }))
    : [
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
        {/* Brand: SleepyKoala Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 text-[#FAFAF9] hover:opacity-90 transition-opacity focus:outline-hidden focus:ring-2 focus:ring-cyan-500 rounded-lg p-1 min-h-[44px]"
          aria-label="SleepyKoala Studio"
        >
          <img
            src="/assets/branding/sleepykoala-logo.png"
            alt="SleepyKoala Logo"
            className="h-10 sm:h-11 w-auto object-contain"
            loading="eager"
          />
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
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-[#A8A29E] hover:text-[#F5F5F4] hover:bg-stone-850 focus:outline-hidden focus:ring-2 focus:ring-stone-400"
            aria-expanded={mobileMenuOpen}
            aria-label="Buka menu navigasi"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-stone-800 bg-[#0f1118] px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg text-base font-medium ${
                isActive(link.path)
                  ? 'bg-stone-850 text-[#F5F5F4] border border-stone-700'
                  : 'text-[#A8A29E] hover:text-[#F5F5F4] hover:bg-stone-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {stats.activeRecruitmentCount > 0 && (
            <Link
              to="/projects?status=CLOSED_TESTING"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between mt-3 px-3 py-2 rounded-lg bg-stone-900 border border-stone-750 text-sm font-medium text-[#E7E5E4]"
            >
              <span className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                Perekrutan Closed Testing
              </span>
              <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-[#A8A29E]">
                {stats.activeRecruitmentCount} Aktif
              </span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
