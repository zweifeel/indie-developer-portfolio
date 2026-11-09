import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Project } from '../types/project';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { ProjectIcon } from './ProjectMedia';

interface ProjectCardProps {
  project: Project;
  featuredHighlight?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  featuredHighlight = false,
}) => {
  const isReady = project.status === 'READY_FOR_RELEASE';
  const isClosedTesting = project.status === 'CLOSED_TESTING';
  const isPreReg = project.status === 'PRE_REGISTRATION';

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 ${
        featuredHighlight
          ? 'bg-[#11131c] border-stone-750 hover:border-stone-600 shadow-sm'
          : 'bg-[#0f1118] border-stone-800 hover:border-stone-700 hover:bg-[#12141f]'
      } p-6 sm:p-7 hover:-translate-y-0.5`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <ProjectIcon
              src={project.icon}
              alt={`Ikon ${project.name}`}
              name={project.name}
              category={project.category}
              className="w-12 h-12"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-[#FAFAF9]">
                  {project.name}
                </h3>
                {project.featured && (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-cyan-950/50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-800/60"
                    title="Proyek Unggulan"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    Featured
                  </span>
                )}
              </div>
              {project.tagline && (
                <p className="text-xs font-mono text-cyan-400 mt-0.5">{project.tagline}</p>
              )}
              {project.version && (
                <span className="text-xs font-mono text-[#78716C]">v{project.version}</span>
              )}
            </div>
          </div>
          <StatusBadge status={project.status} size="sm" />
        </div>

        {/* Categories & Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <CategoryBadge category={project.category} />
          {isClosedTesting && project.registrationOpen && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Butuh Penguji ({project.testerRequirementDays || 14} Hari)</span>
            </span>
          )}
          {isReady && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-800/50 rounded px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Siap Rilis Google Play</span>
            </span>
          )}
          {isPreReg && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 rounded px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>{project.testingUrl ? 'Pra-Registrasi Dibuka' : 'Pre-Registration'}</span>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[#E7E5E4] line-clamp-3 leading-relaxed mb-4">
          {project.shortDescription}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-850 text-[#A8A29E]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Action */}
      <div className="pt-4 border-t border-stone-850 flex items-center justify-between">
        <span className="text-xs text-[#78716C]">
          {project.lastUpdated
            ? `Update: ${new Date(project.lastUpdated).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`
            : 'Fase Aktif'}
        </span>
        <Link
          to={`/projects/${project.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E7E5E4] hover:text-[#FAFAF9] transition-colors group-hover:translate-x-0.5 min-h-[44px] py-2 px-1"
          aria-label={`Lihat rincian lengkap proyek ${project.name}`}
        >
          <span className="underline decoration-stone-700 underline-offset-4 group-hover:decoration-cyan-400">Detail Proyek</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 text-cyan-400" />
        </Link>
      </div>
    </article>
  );
};
