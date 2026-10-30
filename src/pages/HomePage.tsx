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
  Briefcase,
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

  // Key projects
  const mobileKasir = closedTestingProjects.find((p) => p.registrationOpen) || closedTestingProjects[0];
  const dompetNalar = readyProjects[0];
  const worklume = allProjects.find((p) => p.slug === 'worklume');

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Top Studio Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-800 bg-stone-900/90 text-xs font-mono text-[#A8A29E] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#8A8580]" />
              <span>{id.hero.badge}</span>
            </div>

            {/* Headline - Strictly Monochrome, No Gradient */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F5F5F4] leading-[1.15] mb-6">
              {id.hero.titleLine1}{' '}
              <span>{id.hero.titleHighlight}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#D6D3D1] leading-relaxed mb-8 max-w-2xl">
              {id.hero.subtitle}
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-sm shadow-xs transition-all hover:scale-[1.01]"
              >
                <span>{id.hero.ctaProjects}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {mobileKasir && (
                <button
                  type="button"
                  onClick={() => setSelectedTestingProject(mobileKasir)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-850 text-[#E7E5E4] border border-stone-800 hover:border-stone-700 font-medium text-sm transition-all"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span>Daftar Tester {mobileKasir.name}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC STATISTICS - All Numbers in Off-White / Bone White (#F5F5F4), Labels in #A8A29E */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Statistik Proyek">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Projects */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.totalProjects}</span>
              <Layers className="w-4 h-4 text-[#8A8580]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F4] tracking-tight">
              {stats.totalProjects}
            </div>
            <div className="mt-1 text-xs text-[#8A8580]">Proyek aktif studio</div>
          </div>

          {/* Ready For Release */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.readyForRelease}</span>
              <CheckCircle2 className="w-4 h-4 text-[#8A8580]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F4] tracking-tight">
              {stats.readyForReleaseProjects}
            </div>
            <div className="mt-1 text-xs text-[#8A8580]">DompetNalar siap rilis</div>
          </div>

          {/* Closed Testing Active */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.activeRecruitment}</span>
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F4] tracking-tight">
              {stats.activeRecruitmentCount}
            </div>
            <div className="mt-1 text-xs text-[#8A8580]">Mobile Kasir (14 Hari)</div>
          </div>

          {/* In Development */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">{id.stats.inDevelopment}</span>
              <Clock className="w-4 h-4 text-[#8A8580]" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#F5F5F4] tracking-tight">
              {stats.workInProgressProjects}
            </div>
            <div className="mt-1 text-xs text-[#8A8580]">Worklume & 3 Game</div>
          </div>

          {/* Category Ratio: Games / Apps */}
          <div className="col-span-2 lg:col-span-1 rounded-2xl border border-stone-800 bg-[#0f1118] p-5">
            <div className="flex items-center justify-between mb-3 text-[#A8A29E]">
              <span className="text-xs font-mono uppercase tracking-wider">Kategori</span>
              <Gamepad2 className="w-4 h-4 text-[#8A8580]" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
              {stats.totalGames} Game / {stats.totalApplications} App
            </div>
            <div className="mt-1 text-xs text-[#8A8580]">Distribusi portofolio</div>
          </div>
        </div>
      </section>

      {/* SECTION 1: DOMPETNALAR SPOTLIGHT (READY_FOR_RELEASE) */}
      {dompetNalar && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-xs text-[#D6D3D1]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Tahap Closed Testing Selesai</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
                  {dompetNalar.name} — Siap Rilis Google Play
                </h2>
                <p className="text-sm text-[#D6D3D1] leading-relaxed">
                  {dompetNalar.shortDescription} Seluruh kriteria pengujian tertutup 14 hari telah dipenuhi dan saat ini dalam antrean peluncuran publik Google Play Store.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Closed testing Google Play tuntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Persiapan peluncuran publik</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <Link
                  to={`/projects/${dompetNalar.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-xs transition-all hover:scale-[1.01]"
                >
                  <span>Detail {dompetNalar.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-xs text-center text-[#8A8580]">
                  URL Play Store segera tersedia saat rilis
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: MOBILE KASIR SPOTLIGHT (CLOSED_TESTING ACTIVE) */}
      {mobileKasir && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-xs text-[#D6D3D1]">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Perekrutan Penguji Tertutup Aktif</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
                  {mobileKasir.name} — Membutuhkan Penguji
                </h2>
                <p className="text-sm text-[#D6D3D1] leading-relaxed">
                  {mobileKasir.shortDescription} Bantu kami memenuhi standar 14 hari pengujian Google Play Console. Dapatkan akses prarilis dan bantu menguji alur kasir offline.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Wajib komitmen 14 hari instalasi</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Akses prarilis eksklusif</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedTestingProject(mobileKasir)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-xs transition-all hover:scale-[1.01]"
                >
                  <span>Daftar Penguji {mobileKasir.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link
                  to={`/projects/${mobileKasir.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-850 text-[#E7E5E4] text-xs font-medium transition-colors"
                >
                  <span>Lihat Ketentuan 14 Hari</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: WORKLUME HIGHLIGHT (ENTERPRISE / UNIVERSAL PLATFORM) */}
      {worklume && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-2.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-xs text-[#D6D3D1]">
                  <Briefcase className="w-3.5 h-3.5 text-[#A8A29E]" />
                  <span>Universal Work & Reporting Platform</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
                  {worklume.name} — {worklume.tagline}
                </h2>
                <p className="text-sm text-[#D6D3D1] leading-relaxed">
                  {worklume.shortDescription} Dirancang untuk produktivitas mandiri hingga operasional multi-organisasi dengan kapabilitas local-first data management.
                </p>

                <div className="flex flex-wrap gap-2 pt-1 text-xs text-[#8A8580]">
                  <span>• Universal Reporting</span>
                  <span>• Customizable Templates</span>
                  <span>• Organizational Workspaces</span>
                  <span>• Local-First Data</span>
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  to={`/projects/${worklume.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-750 bg-stone-900 hover:bg-stone-850 text-[#F5F5F4] text-xs font-medium transition-colors"
                >
                  <span>Detail & Core Capabilities</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: IN DEVELOPMENT PROJECTS (4 PROJECTS: WORKLUME, IDLE MASTER, IDLE MINING, THE BROKEN ORIGIN) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight mb-1.5">
              {id.sections.developmentList}
            </h2>
            <p className="text-sm text-[#A8A29E]">{id.sections.developmentSub}</p>
          </div>
          <Link
            to="/projects"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#E7E5E4] hover:text-[#F5F5F4] transition-colors underline decoration-stone-750 underline-offset-4"
          >
            <span>{id.sections.viewAllProjects}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {inDevProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* ALL PROJECTS OVERVIEW ROW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight mb-1.5">
              Seluruh Proyek Studio ({allProjects.length})
            </h2>
            <p className="text-sm text-[#A8A29E]">Daftar lengkap enam proyek resmi dalam siklus hidup Google Play & Platform.</p>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E7E5E4] hover:text-[#F5F5F4] transition-colors underline decoration-stone-750 underline-offset-4"
          >
            <span>Buka Katalog Proyek</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* ABOUT PREVIEW & CRAFTSMANSHIP */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-stone-800 bg-[#0d0f15] p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-mono text-[#A8A29E]">
                <Terminal className="w-3.5 h-3.5" />
                <span>{developerProfile.role}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#F5F5F4] tracking-tight">
                {id.sections.aboutPreviewTitle}
              </h2>
              <p className="text-sm text-[#D6D3D1] leading-relaxed">
                {developerProfile.bio}
              </p>

              <div className="space-y-2 pt-1">
                {developerProfile.philosophy.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-[#D6D3D1]">
                    <Zap className="w-3.5 h-3.5 text-[#8A8580] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#E7E5E4] hover:text-[#F5F5F4] transition-colors underline decoration-stone-750 underline-offset-4"
                >
                  <span>{id.sections.readMoreAbout}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href={`mailto:${developerProfile.email}`}
                  className="inline-flex items-center gap-1.5 text-xs text-[#8A8580] hover:text-[#F5F5F4] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{developerProfile.email}</span>
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-stone-800 bg-[#11131c] p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#A8A29E]">
                Pilar Rekayasa Studio
              </h3>
              <div className="space-y-2.5">
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-850">
                  <div className="text-xs font-medium text-[#F5F5F4] mb-0.5">Closed Testing 14 Hari</div>
                  <div className="text-[11px] text-[#A8A29E]">Memenuhi persyaratan uji coba 20 penguji Google Play Console.</div>
                </div>
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-850">
                  <div className="text-xs font-medium text-[#F5F5F4] mb-0.5">Arsitektur Bebas Biaya</div>
                  <div className="text-[11px] text-[#A8A29E]">100% Zero-Cost Stack: Cloudflare Pages + Google Apps Script.</div>
                </div>
                <div className="p-3 rounded-lg bg-stone-900 border border-stone-850">
                  <div className="text-xs font-medium text-[#F5F5F4] mb-0.5">Zero Bloatware</div>
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
