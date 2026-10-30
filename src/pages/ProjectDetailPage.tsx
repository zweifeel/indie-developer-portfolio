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
  FileText,
  LayoutTemplate,
  Users,
  Database,
  Cloud,
  Workflow,
  Download,
  MonitorSmartphone,
  Eye,
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
        <div className="w-14 h-14 mx-auto rounded-2xl bg-stone-900 border border-stone-800 text-stone-300 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-stone-400" />
        </div>
        <h1 className="text-2xl font-bold text-[#F5F5F4] mb-2">{id.errors.projectNotFound}</h1>
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#A8A29E] hover:text-[#F5F5F4] transition-colors underline decoration-stone-800 underline-offset-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{id.projectDetail.backToProjects}</span>
        </Link>
      </div>

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
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
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
                  <span className="text-xs font-mono text-[#8A8580] px-2 py-0.5 rounded bg-stone-900 border border-stone-800">
                    v{project.version}
                  </span>
                )}
                {project.lastUpdated && (
                  <span className="text-xs text-[#8A8580] flex items-center gap-1 ml-1">
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
              <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[#8A8580] text-xs font-medium">
                {id.projectDetail.registrationClosed}
              </span>
            )}

            {/* Conditional Info for internal testing, wip, coming soon */}
            {isInternal && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-[#D6D3D1] text-xs">
                {id.projectDetail.internalTestingInfo}
              </span>
            )}
            {isWip && (
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[#D6D3D1] text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-[#8A8580]" />
                <span>{id.projectDetail.wipInfo}</span>
              </span>
            )}
            {isComingSoon && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 text-[#8A8580] text-xs">
                {id.projectDetail.comingSoonInfo}
              </span>
            )}

            {/* Secondary Action: Feedback Page */}
            <Link
              to={`/projects/${project.slug}/feedback`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-850 text-[#D6D3D1] text-xs font-medium transition-colors"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#A8A29E]" />
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
            <h2 className="text-lg font-bold text-[#F5F5F4] tracking-tight">Keterangan Proyek</h2>
            <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 text-sm text-[#D6D3D1] leading-relaxed whitespace-pre-line">
              {project.fullDescription}
            </div>
          </section>

          {/* DEDICATED WORKLUME SECTION: Core Capabilities (8 Cards) */}
          {isWorklume && project.capabilities && project.capabilities.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#F5F5F4] tracking-tight">
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
                      <h3 className="text-xs font-semibold text-stone-100">{cap.title}</h3>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed pl-8">
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
                <h2 className="text-lg font-bold text-white tracking-tight">Our Vision</h2>
              </div>
              <div className="rounded-2xl border border-cyan-900/40 bg-[#0c121b] p-6 text-xs text-stone-300 leading-relaxed italic">
                "{project.vision}"
              </div>
            </section>
          )}

          {/* Technical Highlights (if available for other projects) */}
          {project.technicalHighlights && project.technicalHighlights.length > 0 && (
            <section className="space-y-3.5">
              <h2 className="text-lg font-bold text-[#F5F5F4] tracking-tight flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#A8A29E]" />
                <span>{id.projectDetail.highlights}</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.technicalHighlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-stone-800 bg-[#0f1118] p-4 text-xs text-[#D6D3D1]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Screenshots Gallery */}
          <section className="space-y-3.5">
            <h2 className="text-lg font-bold text-[#F5F5F4] tracking-tight">
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
              <div className="rounded-2xl border border-dashed border-stone-800 bg-[#0f1118] p-8 text-center text-xs text-[#8A8580]">
                Belum ada screenshot yang dipublikasikan untuk proyek ini.
              </div>
            )}
          </section>
        </div>

        {/* Right Col (4): Testing Requirements / Status Facts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Closed Testing Requirements Card (Shown for CLOSED_TESTING, e.g. Mobile Kasir) */}
          {isClosedTesting && (
            <div className="rounded-2xl border border-cyan-800/60 bg-[#0d141e] p-6 space-y-4">
              <div className="flex items-center gap-2 text-white">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  {id.projectDetail.testingRequirementsTitle}
                </h3>
              </div>
              <ul className="space-y-3 text-xs text-stone-300 leading-relaxed">
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
              <div className="flex items-center gap-2 text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Status: Siap Rilis
                </h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {id.projectDetail.readyForReleaseInfo}
              </p>
              <div className="text-[11px] text-stone-400 pt-1">
                Tautan unduhan Play Store akan langsung ditampilkan di halaman ini setelah rilis resmi aktif.
              </div>
            </div>
          )}

          {/* Work in Progress Card (Shown for Worklume, IDLE MASTER, Idle Mining, The Broken Origin) */}
          {isWip && (
            <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                  Status: Dalam Pengembangan
                </h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {id.projectDetail.wipInfo}
              </p>
              <div className="text-[11px] text-stone-400 pt-1">
                Pendaftaran tester belum dibuka untuk proyek ini.
              </div>
            </div>
          )}

          {/* Metadata Factbox */}
          <div className="rounded-2xl border border-stone-800 bg-[#0f1118] p-6 space-y-4 text-xs">
            <h3 className="font-mono uppercase tracking-wider text-[#A8A29E] text-[11px]">
              Informasi Status
            </h3>
            <div className="space-y-3 divide-y divide-stone-850 text-[#D6D3D1]">
              <div className="pt-2 flex justify-between">
                <span className="text-[#8A8580]">Slug Proyek</span>
                <span className="font-mono text-[#F5F5F4]">{project.slug}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#8A8580]">Kategori</span>
                <span>{id.categoryLabels[project.category]}</span>
              </div>
              <div className="pt-2 flex justify-between">
                <span className="text-[#8A8580]">Status Google Play</span>
                <span>{id.statusLabels[project.status]}</span>
              </div>
              {project.testerRequirementDays && isClosedTesting && (
                <div className="pt-2 flex justify-between">
                  <span className="text-[#8A8580]">Target Hari Uji</span>
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
