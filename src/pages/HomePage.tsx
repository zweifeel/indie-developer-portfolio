import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Gamepad2,
  Layers,
  Radio,
  CheckCircle2,
  Terminal,
  Mail,
  Zap,
  Clock,
} from 'lucide-react';
import { id } from '../locales/id';
import {
  calculateProjectStatistics,
  getAllProjects,
  getClosedTestingProjects,
  getReadyForReleaseProjects,
  getWorkInProgressProjects,
} from '../services/projectService';
import { developerProfile } from '../data/developer';
import { ProjectCard } from '../components/ProjectCard';
import { RegistrationModal } from '../components/RegistrationModal';
import type { Project } from '../types/project';

export const HomePage: React.FC = () => {
  const stats = calculateProjectStatistics();
  const allProjects = getAllProjects();
  const readyProjects = getReadyForReleaseProjects();
  const closedTestingProjects = getClosedTestingProjects();
  const inDevProjects = getWorkInProgressProjects();

  const [selectedTestingProject, setSelectedTestingProject] = useState<Project | null>(null);

  // Identify Mobile Kasir (seeking testers) and DompetNalar (ready for release)
  const mobileKasir = closedTestingProjects.find((p) => p.registrationOpen) || closedTestingProjects[0];
  const dompetNalar = readyProjects[0];

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-8 overflow-hidden">
        {/* Subtle studio cyan ambient lighting (anti-excessive glow) */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] h-[280px] bg-cyan-600/5 blur-[120px] rounded-full pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Top Studio Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-stone-800 bg-stone-900/80 text-xs font-medium text-[#A8A29E] mb-6 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{id.hero.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#FAFAF9] leading-[1.15] mb-6">
              {id.hero.titleLine1}{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-300 via-stone-200 to-cyan-400">
                {id.hero.titleHighlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#E7E5E4] leading-relaxed mb-8 max-w-2xl">
              {id.hero.subtitle}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-sm shadow-sm transition-all hover:scale-[1.02]"
              >
                <span>{id.hero.ctaProjects}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {mobileKasir && (
                <button
                  type="button"
                  onClick={() => setSelectedTestingProject(mobileKasir)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-800/60 font-semibold text-sm transition-all"
                >
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Daftar Tester {mobileKasir.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC STATISTICS (Calculated from JSON) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Statistik Proyek">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {/* Total Projects */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f121d] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.totalProjects}</span>
              <Layers className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FAFAF9] tracking-tight">
              {stats.totalProjects}
            </div>
            <div className="mt-1 text-xs text-[#78716C]">Proyek aktif studio</div>
          </div>

          {/* Ready For Release */}
          <div className="rounded-2xl border border-emerald-900/40 bg-linear-to-b from-emerald-950/20 to-[#0f121d] p-5">
            <div className="flex items-center justify-between mb-3 text-emerald-300">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.readyForRelease}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FAFAF9] tracking-tight">
              {stats.readyForReleaseProjects}
            </div>
            <div className="mt-1 text-xs text-emerald-400/80">DompetNalar siap rilis</div>
          </div>

          {/* Closed Testing Active */}
          <div className="rounded-2xl border border-cyan-900/50 bg-linear-to-b from-cyan-950/20 to-[#0f121d] p-5">
            <div className="flex items-center justify-between mb-3 text-cyan-200">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.activeRecruitment}</span>
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FAFAF9] tracking-tight">
              {stats.activeRecruitmentCount}
            </div>
            <div className="mt-1 text-xs text-cyan-300/80">Mobile Kasir (14 Hari)</div>
          </div>

          {/* In Development */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f121d] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.inDevelopment}</span>
              <Clock className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#FAFAF9] tracking-tight">
              {stats.workInProgressProjects}
            </div>
            <div className="mt-1 text-xs text-[#78716C]">3 Game & MMORPG</div>
          </div>

          {/* Category Ratio: Games / Apps */}
          <div className="col-span-2 lg:col-span-1 rounded-2xl border border-stone-800 bg-[#0f121d] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">Kategori</span>
              <Gamepad2 className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#FAFAF9] tracking-tight">
              {stats.totalGames} Game / {stats.totalApplications} App
            </div>
            <div className="mt-1 text-xs text-[#78716C]">Portofolio Google Play</div>
          </div>
        </div>
      </section>

      {/* SECTION 1: DOMPETNALAR SPOTLIGHT (READY_FOR_RELEASE) */}
      {dompetNalar && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-emerald-800/40 bg-linear-to-r from-emerald-950/20 via-[#101322] to-[#0c0e18] p-6 sm:p-10 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tahap Closed Testing Selesai</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#FAFAF9] tracking-tight">
                  {dompetNalar.name} — Siap Rilis Google Play
                </h2>
                <p className="text-sm text-[#E7E5E4] leading-relaxed">
                  {dompetNalar.shortDescription} Seluruh kriteria pengujian tertutup 14 hari telah dipenuhi dan saat ini dalam antrean peluncuran publik Google Play Store.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#E7E5E4]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Closed testing Google Play tuntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#E7E5E4]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Persiapan peluncuran publik</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Link
                  to={`/projects/${dompetNalar.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-all hover:scale-[1.02]"
                >
                  <span>Detail {dompetNalar.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <span className="text-xs text-center text-[#78716C]">
                  URL Play Store segera tersedia saat rilis publik
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: MOBILE KASIR SPOTLIGHT (CLOSED_TESTING ACTIVE) */}
      {mobileKasir && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-cyan-800/40 bg-linear-to-r from-cyan-950/20 via-[#101322] to-[#0c0e18] p-6 sm:p-10 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-xs font-semibold text-cyan-200">
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Perekrutan Penguji Tertutup Aktif</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#FAFAF9] tracking-tight">
                  {mobileKasir.name} — Membutuhkan Penguji
                </h2>
                <p className="text-sm text-[#E7E5E4] leading-relaxed">
                  {mobileKasir.shortDescription} Bantu kami memenuhi standar 14 hari pengujian Google Play Console. Dapatkan akses prarilis dan bantu menguji alur kasir offline.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#E7E5E4]">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Wajib komitmen 14 hari instalasi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#E7E5E4]">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Akses prarilis eksklusif</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTestingProject(mobileKasir)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-semibold text-sm shadow-sm transition-all hover:scale-[1.02]"
                >
                  <span>Daftar Penguji {mobileKasir.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to={`/projects/${mobileKasir.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-stone-800 bg-stone-900/60 hover:bg-stone-850 text-[#E7E5E4] text-xs font-medium transition-colors"
                >
                  <span>Lihat Rincian Pengujian</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: IN DEVELOPMENT PROJECTS (IDLE MASTER, IDLE MINING, THE BROKEN ORIGIN) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#FAFAF9] tracking-tight mb-2">
              {id.sections.developmentList}
            </h2>
            <p className="text-sm text-[#A8A29E]">{id.sections.developmentSub}</p>
          </div>
          <Link
            to="/projects"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#67E8F9] hover:text-[#A5F3FC] transition-colors"
          >
            <span>{id.sections.viewAllProjects}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {inDevProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* ALL PROJECTS OVERVIEW ROW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#FAFAF9] tracking-tight mb-2">
              Seluruh Proyek Studio ({allProjects.length})
            </h2>
            <p className="text-sm text-[#A8A29E]">Daftar lengkap 5 proyek resmi dalam siklus hidup Google Play.</p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#67E8F9] hover:text-[#A5F3FC] transition-colors"
          >
            <span>Buka Katalog Proyek</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* ABOUT PREVIEW & CRAFTSMANSHIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-stone-800 bg-[#0d101a] p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <Terminal className="w-4 h-4" />
                <span>{developerProfile.role}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#FAFAF9] tracking-tight">
                {id.sections.aboutPreviewTitle}
              </h2>
              <p className="text-sm text-[#E7E5E4] leading-relaxed">
                {developerProfile.bio}
              </p>

              <div className="space-y-2 pt-2">
                {developerProfile.philosophy.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#E7E5E4]">
                    <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#67E8F9] hover:text-[#A5F3FC] transition-colors"
                >
                  <span>{id.sections.readMoreAbout}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={`mailto:${developerProfile.email}`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#A8A29E] hover:text-[#FAFAF9] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[#A8A29E]" />
                  <span>{developerProfile.email}</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-stone-800 bg-[#121522] p-6 space-y-4 shadow-inner">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A8A29E]">
                Pilar Rekayasa Studio
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-xs font-semibold text-[#FAFAF9] mb-0.5">Closed Testing 14 Hari</div>
                  <div className="text-[11px] text-[#A8A29E]">Memenuhi persyaratan uji coba 20 penguji Google Play Console.</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-xs font-semibold text-[#FAFAF9] mb-0.5">Arsitektur Bebas Biaya</div>
                  <div className="text-[11px] text-[#A8A29E]">100% Zero-Cost Stack: Cloudflare Pages + Google Apps Script.</div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-xs font-semibold text-[#FAFAF9] mb-0.5">Zero Bloatware</div>
                  <div className="text-[11px] text-[#A8A29E]">Efisien, ringan, hemat konsumsi memori dan baterai perangkat.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal for closed testing registration */}
      {selectedTestingProject && (
        <RegistrationModal
          isOpen={true}
          onClose={() => setSelectedTestingProject(null)}
          project={selectedTestingProject}
        />
      )}
    </div>
  );
};
