import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  MessageSquarePlus,
  Radio,
  CheckCircle2,
  FileCode2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { getProjectBySlug } from '../services/projectService';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { ProjectIcon, ScreenshotImage } from '../components/ProjectMedia';
import { RegistrationModal } from '../components/RegistrationModal';
import { id } from '../locales/id';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const project = getProjectBySlug(slug || '');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Handle Unknown Slug Gracefully
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 border border-stone-800 text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#FAFAF9] mb-2">{id.errors.projectNotFound}</h1>
        <p className="text-sm text-[#A8A29E] mb-8 max-w-md mx-auto">
          {id.errors.projectNotFoundDesc}
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{id.projectDetail.backToProjects}</span>
        </Link>
      </div>
    );
  }

  const isReadyForRelease = project.status === 'READY_FOR_RELEASE';
  const isClosedTesting = project.status === 'CLOSED_TESTING';
  const isReleased = project.status === 'RELEASED';
  const isInternal = project.status === 'INTERNAL_TESTING';
  const isWip = project.status === 'WORK_IN_PROGRESS';
  const isComingSoon = project.status === 'COMING_SOON';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Back Link */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A8A29E] hover:text-[#67E8F9] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{id.projectDetail.backToProjects}</span>
        </Link>
      </div>

      {/* Project Header Banner */}
      <div className="rounded-3xl border border-stone-800 bg-[#0f121d] p-6 sm:p-10 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <ProjectIcon
              src={project.icon}
              alt={`Ikon ${project.name}`}
              name={project.name}
              category={project.category}
              className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[#FAFAF9] tracking-tight">
                  {project.name}
                </h1>
                {project.featured && (
                  <span className="inline-flex items-center gap-1 rounded bg-stone-800 px-2 py-0.5 text-xs font-semibold text-stone-300 border border-stone-700">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Featured
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <CategoryBadge category={project.category} />
                <StatusBadge status={project.status} />
                {project.version && (
                  <span className="text-xs font-mono text-[#A8A29E] px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                    v{project.version}
                  </span>
                )}
                {project.lastUpdated && (
                  <span className="text-xs text-[#78716C] flex items-center gap-1 ml-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Diperbarui: {new Date(project.lastUpdated).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Actions based on Status */}
          <div className="flex flex-wrap md:flex-col gap-3 shrink-0">
            {/* Conditional Action: READY_FOR_RELEASE */}
            {isReadyForRelease && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Siap Rilis Google Play (Menunggu Jadwal)</span>
              </span>
            )}

            {/* Conditional Action: RELEASED (Only when URL exists) */}
            {isReleased && project.playStoreUrl && (
              <a
                href={project.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all hover:scale-[1.02]"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{id.projectDetail.playStoreAction}</span>
              </a>
            )}

            {/* Conditional Action: CLOSED_TESTING + registrationOpen === true */}
            {isClosedTesting && project.registrationOpen && (
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-semibold text-sm shadow-sm transition-all hover:scale-[1.02]"
              >
                <Radio className="w-4 h-4 text-stone-900 animate-pulse" />
                <span>{id.projectDetail.joinTestingAction}</span>
              </button>
            )}

            {/* Conditional Action: CLOSED_TESTING + registrationOpen === false */}
            {isClosedTesting && !project.registrationOpen && (
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[#78716C] text-xs font-medium">
                {id.projectDetail.registrationClosed}
              </span>
            )}

            {/* Conditional Info for internal testing, wip, coming soon */}
            {isInternal && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs">
                {id.projectDetail.internalTestingInfo}
              </span>
            )}
            {isWip && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[#A8A29E] text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{id.projectDetail.wipInfo}</span>
              </span>
            )}
            {isComingSoon && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-[#78716C] text-xs">
                {id.projectDetail.comingSoonInfo}
              </span>
            )}

            {/* Secondary Action: Feedback Page */}
            <Link
              to={`/projects/${project.slug}/feedback`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-800 bg-stone-900/80 hover:bg-stone-850 text-[#E7E5E4] text-xs font-medium transition-colors"
            >
              <MessageSquarePlus className="w-4 h-4 text-cyan-400" />
              <span>{id.projectDetail.provideFeedback}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Description + Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col (8): Description, Highlights, Screenshots */}
        <div className="lg:col-span-8 space-y-10">
          {/* Full Description */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#FAFAF9] tracking-tight">Keterangan Proyek</h2>
            <div className="rounded-2xl border border-stone-800 bg-[#0f121d] p-6 sm:p-7 text-sm text-[#E7E5E4] leading-relaxed whitespace-pre-line">
              {project.fullDescription}
            </div>
          </section>

          {/* Technical Highlights (if present) */}
          {project.technicalHighlights && project.technicalHighlights.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-[#FAFAF9] tracking-tight flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-cyan-400" />
                <span>{id.projectDetail.highlights}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.technicalHighlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-stone-800 bg-[#0f121d] p-4 text-xs text-[#E7E5E4]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Screenshots Gallery */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#FAFAF9] tracking-tight">
              {id.projectDetail.screenshots}
            </h2>
            {project.screenshots && project.screenshots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {project.screenshots.map((shot, idx) => (
                  <ScreenshotImage
                    key={idx}
                    src={shot}
                    alt={`Cuplikan Layar ${project.name} #${idx + 1}`}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-800 bg-[#0f121d] p-8 text-center text-xs text-[#78716C]">
                Belum ada screenshot yang dipublikasikan untuk proyek ini.
              </div>
            )}
          </section>
        </div>

        {/* Right Col (4): Testing Requirements / Status Facts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Closed Testing Requirements Card (Shown for CLOSED_TESTING, e.g. Mobile Kasir) */}
          {isClosedTesting && (
            <div className="rounded-2xl border border-cyan-800/40 bg-linear-to-b from-cyan-950/20 to-[#0f121d] p-6 space-y-4">
              <div className="flex items-center gap-2 text-cyan-300">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  {id.projectDetail.testingRequirementsTitle}
                </h3>
              </div>
              <ul className="space-y-3 text-xs text-[#E7E5E4] leading-relaxed">
                {id.projectDetail.testingRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-mono font-bold mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
              {project.registrationOpen && (
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full mt-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-stone-950 text-xs font-semibold transition-colors"
                >
                  {id.projectDetail.joinTestingAction}
                </button>
              )}
            </div>
          )}

          {/* Ready For Release Card (Shown for DompetNalar) */}
          {isReadyForRelease && (
            <div className="rounded-2xl border border-emerald-800/40 bg-linear-to-b from-emerald-950/20 to-[#0f121d] p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Status: Siap Rilis
                </h3>
              </div>
              <p className="text-xs text-[#E7E5E4] leading-relaxed">
                {id.projectDetail.readyForReleaseInfo}
              </p>
              <div className="text-[11px] text-[#A8A29E] pt-1">
                Tautan unduhan Play Store akan langsung ditampilkan di halaman ini setelah rilis resmi aktif.
              </div>
            </div>
          )}

          {/* Metadata Factbox */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f121d] p-6 space-y-4 text-xs">
            <h3 className="font-mono uppercase tracking-wider text-[#A8A29E] text-[11px]">
              Informasi Status
            </h3>
            <div className="space-y-3 divide-y divide-stone-800/80 text-[#E7E5E4]">
              <div className="pt-2 flex justify-between">
                <span className="text-[#78716C]">Slug Proyek</span>
                <span className="font-mono text-[#FAFAF9]">{project.slug}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#78716C]">Kategori</span>
                <span>{id.categoryLabels[project.category]}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#78716C]">Status Google Play</span>
                <span>{id.statusLabels[project.status]}</span>
              </div>
              {project.testerRequirementDays && isClosedTesting && (
                <div className="pt-2 flex justify-between">
                  <span className="text-[#78716C]">Target Hari Uji</span>
                  <span>{project.testerRequirementDays} Hari Berurutan</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {isClosedTesting && project.registrationOpen && (
        <RegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          project={project}
        />
      )}
    </div>
  );
};
