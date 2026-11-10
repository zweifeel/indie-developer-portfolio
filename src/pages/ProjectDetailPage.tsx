import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
  FileText,
  LayoutTemplate,
  Users,
  Database,
  Cloud,
  Workflow,
  Download,
  MonitorSmartphone,
  Eye,
  Layers,
  Box,
} from 'lucide-react';
import { useProjects } from '../services/projectService';
import {
  fetchPublicProjectProgress,
  fetchAdminProgressPreview,
} from '../services/cmsProgressService';
import { PublicProjectProgress } from '../types/portfolioProgress';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { ProjectIcon, ScreenshotImage } from '../components/ProjectMedia';
import { RegistrationModal } from '../components/RegistrationModal';
import { usePageMeta } from '../hooks/usePageMeta';
import { id } from '../locales/id';
import { ThreeCampusCanvas } from '../components/virtual-office/ThreeCampusCanvas';
import { VIRTUAL_OFFICE_SIMULATION_LABEL } from '../types/virtualOffice';

export const ProjectDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  const { projects: allProjects, isUnavailable, refresh } = useProjects();
  const project = allProjects.find((p) => p.slug.toLowerCase() === slug?.toLowerCase());
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Dynamic Canonical Progress Metadata State (Stage 5)
  const [progress, setProgress] = useState<PublicProjectProgress | null>(null);
  const [, setProgressLoading] = useState(false);

  useEffect(() => {
    if (!project) return;
    let isMounted = true;
    setProgressLoading(true);

    const loadProgress = async () => {
      try {
        if (isPreview) {
          const res = await fetchAdminProgressPreview(project.slug);
          if (isMounted && res.success && res.data) {
            setProgress(res.data);
          }
        } else {
          const res = await fetchPublicProjectProgress(project.slug);
          if (isMounted && res.success && res.data) {
            setProgress(res.data);
          }
        }
      } catch {
        // Fail-closed: keep progress null
      } finally {
        if (isMounted) setProgressLoading(false);
      }
    };

    loadProgress();
    return () => {
      isMounted = false;
    };
  }, [project, isPreview]);

  const jsonLd = useMemo(() => {
    if (!project) return null;
    return {
      '@context': 'https://schema.org',
      '@type': project.category === 'GAME' ? 'VideoGame' : 'SoftwareApplication',
      name: project.name,
      description: project.shortDescription,
      operatingSystem: 'Android',
      applicationCategory: project.category === 'GAME' ? 'GameApplication' : 'Application',
      softwareVersion: project.version,
      author: {
        '@type': 'Organization',
        name: 'SleepyKoala Studio',
      },
    };
  }, [project]);

  usePageMeta({
    title: project
      ? isPreview
        ? `[PREVIEW] ${project.name} — Pratinjau Editorial`
        : `${project.name} — ${project.tagline || 'Detail Proyek'}`
      : 'Detail Proyek',
    description: project?.shortDescription,
    canonicalPath: project ? `/projects/${project.slug}` : '/projects',
    ogType: 'article',
    jsonLd,
    noindex: isPreview,
  });

  // Handle Backend Unavailable State
  if (isUnavailable) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950/30 border border-amber-900/60 text-[#FAFAF9] flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#FAFAF9] mb-2">Layanan Detail Proyek Tidak Tersedia</h1>
        <p className="text-sm text-[#A8A29E] mb-8 max-w-md mx-auto">
          Informasi detail proyek tidak dapat dimuat saat ini karena gangguan koneksi ke server backend.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => refresh()}
            className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-sm font-semibold transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{id.projectDetail.backToProjects}</span>
          </Link>
        </div>
      </div>
    );
  }

  // Handle Unknown Slug Gracefully
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 border border-stone-800 text-[#FAFAF9] flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
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
  const isPreRegistration = project.status === 'PRE_REGISTRATION';
  const isClosedTesting = project.status === 'CLOSED_TESTING';
  const isReleased = project.status === 'RELEASED';
  const isInternal = project.status === 'INTERNAL_TESTING';
  const isWip = project.status === 'WORK_IN_PROGRESS';
  const isComingSoon = project.status === 'COMING_SOON';
  const isWorklume = project.slug === 'worklume';

  // Helper icon mapper for Worklume Core Capabilities
  const getCapabilityIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'LayoutTemplate':
        return <LayoutTemplate className="w-4 h-4 text-cyan-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-cyan-400" />;
      case 'Database':
        return <Database className="w-4 h-4 text-cyan-400" />;
      case 'Cloud':
        return <Cloud className="w-4 h-4 text-cyan-400" />;
      case 'Workflow':
        return <Workflow className="w-4 h-4 text-cyan-400" />;
      case 'Download':
        return <Download className="w-4 h-4 text-cyan-400" />;
      case 'MonitorSmartphone':
      default:
        return <MonitorSmartphone className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Back Link */}
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A8A29E] hover:text-[#FAFAF9] transition-colors underline decoration-stone-800 underline-offset-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{id.projectDetail.backToProjects}</span>
        </Link>
      </div>

      {/* Preview Mode Notification Banner */}
      {isPreview && (
        <div className="rounded-2xl border border-amber-800/80 bg-amber-950/80 p-4 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold tracking-wide">[PREVIEW MODE] Pratinjau Tinjauan Internal</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5">
                Menampilkan metadata berstatus draft dan review. Halaman ini terproteksi dan tidak terindeks oleh mesin pencari publik.
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded bg-amber-900/80 text-amber-300 border border-amber-700/80 shrink-0">
            NOINDEX
          </span>
        </div>
      )}

      {/* Project Header Banner */}
      <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <ProjectIcon
              src={project.icon}
              alt={`Ikon ${project.name}`}
              name={project.name}
              category={project.category}
              className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl"
            />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#FAFAF9] tracking-tight">
                  {project.name}
                </h1>
                {project.featured && (
                  <span className="inline-flex items-center gap-1 rounded bg-cyan-950/50 px-2 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-800/60">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Featured
                  </span>
                )}
              </div>

              {project.tagline && (
                <p className="text-sm font-mono text-cyan-400">{project.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <CategoryBadge category={project.category} />
                <StatusBadge status={project.status} />
                {project.version && (
                  <span className="text-xs font-mono text-[#78716C] px-2 py-0.5 rounded bg-stone-900 border border-stone-850">
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
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
            {/* Conditional Action: READY_FOR_RELEASE */}
            {isReadyForRelease && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Siap Rilis Google Play (Menunggu Jadwal)</span>
              </span>
            )}

            {/* Conditional Action: PRE_REGISTRATION */}
            {isPreRegistration && project.testingUrl && (
              <a
                href={project.testingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-stone-950 font-bold text-xs shadow-xs transition-all hover:scale-[1.01]"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{id.projectDetail.preRegistrationAction}</span>
              </a>
            )}
            {isPreRegistration && !project.testingUrl && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                <span>Pre-Registration (Pendaftaran Minat Segera Dibuka)</span>
              </span>
            )}

            {/* Conditional Action: RELEASED (Only when URL exists) */}
            {isReleased && project.playStoreUrl && (
              <a
                href={project.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-white text-stone-950 font-semibold text-xs shadow-xs transition-all hover:scale-[1.01]"
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-stone-950 font-bold text-xs shadow-xs transition-all hover:scale-[1.01]"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse" />
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
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-[#E7E5E4] text-xs">
                {id.projectDetail.internalTestingInfo}
              </span>
            )}
            {isWip && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[#E7E5E4] text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-[#78716C]" />
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-850 text-[#E7E5E4] text-xs font-medium transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>{id.projectDetail.provideFeedback}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col (8): Description, Worklume Core Capabilities, Highlights, Screenshots */}
        <div className="lg:col-span-8 space-y-10">
          {/* Full Description / Overview */}
          <section className="space-y-3.5">
            <h2 className="text-lg font-bold text-[#FAFAF9] tracking-tight">Keterangan Proyek</h2>
            <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 text-sm text-[#E7E5E4] leading-relaxed whitespace-pre-line">
              {project.fullDescription}
            </div>
          </section>

          {/* DEDICATED WORKLUME SECTION: Core Capabilities (8 Cards) */}
          {isWorklume && project.capabilities && project.capabilities.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#FAFAF9] tracking-tight">
                  Core Capabilities
                </h2>
                <p className="text-xs text-[#A8A29E] mt-1">
                  Arsitektur fungsional terintegrasi untuk produktivitas mandiri dan multi-organisasi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {project.capabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-stone-800 bg-[#0f1118] p-4 space-y-1.5 hover:border-cyan-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/50">
                        {getCapabilityIcon(cap.icon)}
                      </div>
                      <h3 className="text-xs font-semibold text-[#FAFAF9]">{cap.title}</h3>
                    </div>
                    <p className="text-xs text-[#E7E5E4] leading-relaxed pl-8">
                      {cap.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DEDICATED WORKLUME SECTION: Our Vision */}
          {isWorklume && project.vision && (
            <section className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h2 className="text-lg font-bold text-[#FAFAF9] tracking-tight">Our Vision</h2>
              </div>
              <div className="rounded-2xl border border-cyan-900/40 bg-[#0c121b] p-6 text-xs text-[#E7E5E4] leading-relaxed italic">
                "{project.vision}"
              </div>
            </section>
          )}

          {/* Technical Highlights (if available for other projects) */}
          {project.technicalHighlights && project.technicalHighlights.length > 0 && (
            <section className="space-y-3.5">
              <h2 className="text-lg font-bold text-[#FAFAF9] tracking-tight flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-cyan-400" />
                <span>{id.projectDetail.highlights}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.technicalHighlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-stone-800 bg-[#0f1118] p-4 text-xs text-[#E7E5E4]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DEDICATED PROGRESS SECTION 1: Strategic Roadmap (Canonical Metadata v2) */}
          {progress?.roadmap && progress.roadmap.length > 0 && (
            <section className="space-y-4" aria-labelledby="strategic-roadmap-title">
              <div className="flex items-center justify-between">
                <h2 id="strategic-roadmap-title" className="text-lg font-bold text-[#FAFAF9] tracking-tight flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  <span>Strategic Roadmap</span>
                </h2>
                <span className="text-[11px] font-mono text-[#A8A29E]">
                  {progress.roadmap.filter((m) => m.implementationStatus === 'completed').length} / {progress.roadmap.length} Selesai
                </span>
              </div>

              <div className="space-y-3">
                {progress.roadmap.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-stone-800 bg-[#0f1118] p-4 space-y-2 hover:border-cyan-800/60 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-900 text-stone-400 border border-stone-850">
                          #{m.order}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-[#FAFAF9]">{m.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.targetQuarter && (
                          <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                            {m.targetQuarter}
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            m.implementationStatus === 'completed'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                              : m.implementationStatus === 'in_progress'
                              ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/50'
                              : 'bg-stone-900 text-[#78716C] border border-stone-850'
                          }`}
                        >
                          {m.implementationStatus === 'completed'
                            ? 'Selesai'
                            : m.implementationStatus === 'in_progress'
                            ? 'Dalam Pengerjaan'
                            : 'Rencana'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-[#E7E5E4] leading-relaxed pl-0.5">{m.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* DEDICATED PROGRESS SECTION 2: Verified Features Specification */}
          {progress?.features && progress.features.length > 0 && (
            <section className="space-y-4" aria-labelledby="verified-features-title">
              <h2 id="verified-features-title" className="text-lg font-bold text-[#FAFAF9] tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Spesifikasi Fitur Terverifikasi</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {progress.features.map((feat) => (
                  <div
                    key={feat.id}
                    className="rounded-xl border border-stone-800 bg-[#0f1118] p-4 space-y-1.5 hover:border-cyan-800/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-bold text-[#FAFAF9]">{feat.title}</h3>
                      {feat.category && (
                        <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                          {feat.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#E7E5E4] leading-relaxed">{feat.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Screenshots Gallery (Merged Canonical Progress Screenshots + Baseline) */}
          <section className="space-y-3.5">
            <h2 className="text-lg font-bold text-[#FAFAF9] tracking-tight">
              {id.projectDetail.screenshots}
            </h2>
            {progress?.screenshots && progress.screenshots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {progress.screenshots.map((shot, idx) => (
                  <div key={shot.id} className="space-y-1.5">
                    <ScreenshotImage
                      src={shot.path}
                      alt={shot.caption || `Cuplikan Layar ${project.name} #${idx + 1}`}
                      index={idx}
                    />
                    {shot.caption && (
                      <p className="text-[11px] text-[#A8A29E] leading-tight px-1">{shot.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : project.screenshots && project.screenshots.length > 0 ? (
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
              <div className="rounded-2xl border border-dashed border-stone-800 bg-[#0f1118] p-8 text-center text-xs text-[#78716C]">
                Belum ada screenshot yang dipublikasikan untuk proyek ini.
              </div>
            )}
          </section>

          {/* DEDICATED PROGRESS SECTION 3: Development Activity & Public Timeline */}
          {progress?.events && progress.events.length > 0 && (
            <section className="space-y-4" aria-labelledby="activity-timeline-title">
              <h2 id="activity-timeline-title" className="text-lg font-bold text-[#FAFAF9] tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Linimasa Perkembangan Proyek</span>
              </h2>

              <div className="space-y-3">
                {progress.events.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-xl border border-stone-800 bg-[#0f1118] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <h3 className="text-xs sm:text-sm font-semibold text-[#FAFAF9]">{evt.title}</h3>
                      </div>
                      <p className="text-xs text-[#E7E5E4] leading-relaxed">{evt.description}</p>
                    </div>
                    <span className="text-xs font-mono text-[#78716C] shrink-0">
                      {new Date(evt.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Col (4): Testing Requirements / Status Facts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Closed Testing Requirements Card (Shown for CLOSED_TESTING, e.g. Mobile Kasir) */}
          {isClosedTesting && (
            <div className="rounded-2xl border border-cyan-800/60 bg-[#0d141e] p-6 space-y-4">
              <div className="flex items-center gap-2 text-[#FAFAF9]">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
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
                  className="w-full mt-2 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-stone-950 text-xs font-bold transition-colors shadow-xs"
                >
                  {id.projectDetail.joinTestingAction}
                </button>
              )}
            </div>
          )}

          {/* Ready For Release Card (Shown for DompetNalar) */}
          {isReadyForRelease && (
            <div className="rounded-2xl border border-emerald-800/50 bg-[#0d1714] p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#FAFAF9]">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
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

          {/* Work in Progress Card (Shown for Worklume, IDLE MASTER, Idle Mining, The Broken Origin) */}
          {isWip && (
            <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#FAFAF9]">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                  Status: Dalam Pengembangan
                </h3>
              </div>
              <p className="text-xs text-[#E7E5E4] leading-relaxed">
                {id.projectDetail.wipInfo}
              </p>
              <div className="text-[11px] text-[#A8A29E] pt-1">
                Pendaftaran tester belum dibuka untuk proyek ini.
              </div>
            </div>
          )}

          {/* Metadata Factbox */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 space-y-4 text-xs">
            <h3 className="font-mono uppercase tracking-wider text-[#A8A29E] text-[11px]">
              Informasi Status
            </h3>
            <div className="space-y-3 divide-y divide-stone-850 text-[#E7E5E4]">
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

          {/* Compliance & Policy Links */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 space-y-3 text-xs">
            <h3 className="font-mono uppercase tracking-wider text-[#A8A29E] text-[11px]">
              Kepatuhan Google Play
            </h3>
            <div className="space-y-2 pt-1">
              <Link
                to={`/projects/${project.slug}/privacy`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 hover:bg-stone-850 text-slate-300 hover:text-cyan-400 border border-stone-800 transition"
              >
                <span>Kebijakan Privasi</span>
                <span className="text-xs">&rarr;</span>
              </Link>
              <Link
                to={`/projects/${project.slug}/delete-account`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-900/60 hover:bg-stone-850 text-slate-300 hover:text-rose-400 border border-stone-800 transition"
              >
                <span>Hapus Akun & Data</span>
                <span className="text-xs">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* VIRTUAL DEVELOPMENT OFFICE — 3D INTERACTIVE WORKSPACE (KAYKIT THREE.JS) */}
      {project && (
        <section className="pt-8 border-t border-stone-850 space-y-4" aria-labelledby="virtual-office-3d-title">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-stone-800 bg-stone-900/60 backdrop-blur-xs">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] font-mono font-medium text-cyan-300 mb-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>{VIRTUAL_OFFICE_SIMULATION_LABEL}</span>
              </div>
              <h2 id="virtual-office-3d-title" className="text-xl sm:text-2xl font-bold text-stone-100 flex items-center gap-2.5">
                <span>Ruang Kerja Tim: {project.name}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-800 text-cyan-300 font-mono font-normal">
                  {project.category}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1">
                Simulasi visual 3D Low-Poly WebGL ruang kerja 5 agent inti SleepyKoala Studio. Tema: Android Studio Space.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-800/60 bg-cyan-950/40 text-cyan-300 text-xs font-mono font-bold shrink-0">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Low-Poly WebGL</span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-cyan-500 text-stone-950 font-extrabold">LIVE</span>
            </div>
          </div>
          <ThreeCampusCanvas
            projects={allProjects}
            initialFocusedSlug={project.slug}
          />
        </section>
      )}

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
